import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => { },
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            subscription:subscriptions!subscriptions_profile_id_fkey(
              id,
              plan_key,
              status,
              started_at,
              ends_at,
              plan:plans(*)
            )
          `)
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          // Handle network errors gracefully
          if (error.message?.includes('Network request failed') || 
              error.message?.includes('fetch') ||
              error.name === 'TypeError') {
            console.warn('[Auth] Network error loading profile, continuing without profile');
            setProfile(null);
            setLoading(false);
            return;
          }
          throw error;
        }
        
        console.debug('[Auth] loadProfile:', userId, data?.role);
        
        // Flatten subscription data for easier access
        const profileData = data ? {
          ...data,
          subscription_tier: data.subscription?.[0]?.plan_key || 'free',
          subscription_status: data.subscription?.[0]?.status || 'active',
        } : null;
        
        setProfile(profileData);
      } catch (error: any) {
        console.error('Error loading profile:', error);
        // Don't set profile on error, but still stop loading
        setProfile(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  }, [loadProfile, user?.id]);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
      setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
      if (!isMounted) return;
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          // If it's a network error, continue without session
          if (error.message?.includes('Network request failed') || 
              error.message?.includes('fetch')) {
            console.warn('[Auth] Network error, continuing without session');
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }
          throw error;
        }
        
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      } else {
        setProfile(null);
          setLoading(false);
        }
      } catch (error: any) {
        console.error('[Auth] Error initializing session:', error);
        // Handle network errors gracefully
        if (error?.message?.includes('Network request failed') || 
            error?.message?.includes('fetch') ||
            error?.name === 'TypeError') {
          console.warn('[Auth] Network error during initialization, continuing without session');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        console.debug('[Auth] onAuthStateChange: signed in', nextSession.user.id);
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
