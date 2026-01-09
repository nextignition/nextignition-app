import { useEffect } from 'react';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function Index() {
  const { session, loading } = useAuth();
  const params = useLocalSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    console.log('[Index] Routing check:', {
      pathname,
      params: Object.keys(params),
      hasSession: !!session,
      type: params.type,
      access_token: !!params.access_token,
      token_hash: !!params.token_hash,
      token: !!params.token,
    });

    // Check if we're already on email-verified or reset-password route (from deep link)
    if (pathname?.includes('email-verified')) {
      console.log('[Index] Already on email-verified, skipping redirect');
      return;
    }
    if (pathname?.includes('reset-password')) {
      console.log('[Index] Already on reset-password, skipping redirect');
      return; // Don't redirect if already on reset-password
    }

    // Check URL params for email verification
    // Supabase sends: type=signup&token=xxx or type=email&token=xxx
    const isEmailVerification = (params.type === 'signup' || params.type === 'email') && 
                                (params.token || params.token_hash);
    
    if (isEmailVerification) {
      console.log('[Index] Email verification detected, processing...');
      
      // Process the email verification token
      const processVerification = async () => {
        try {
          // Supabase automatically verifies the email when the link is clicked
          // We just need to redirect to the success page
          const { data: { session: verifiedSession } } = await supabase.auth.getSession();
          
          if (verifiedSession) {
            console.log('[Index] Email verified, user has session');
            // Sign out the temporary session created by verification
            await supabase.auth.signOut();
          }
          
          // Redirect to email verified page
          router.replace('/(auth)/email-verified');
        } catch (error) {
          console.error('[Index] Error processing verification:', error);
          // Still redirect to email-verified page (it will show success)
          router.replace('/(auth)/email-verified');
        }
      };
      
      processVerification();
      return;
    }

    // Check URL params for password reset indicators
    const isPasswordReset = params.type === 'recovery' || 
                           params.access_token || 
                           params.token_hash;

    if (isPasswordReset) {
      console.log('[Index] Password reset detected, routing to reset-password');
      router.replace('/(auth)/reset-password');
      return;
    }

    // Check if there's a session that might be from password reset
    // This handles the case where Supabase processed the token but we missed the params
    const checkResetSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        // If we have a session but no profile loaded, it might be a password reset session
        if (currentSession && !session) {
          console.log('[Index] Found session without profile, might be password reset');
          // Check if we can navigate to reset-password to let it handle it
          router.replace('/(auth)/reset-password');
          return;
        }
      } catch (error) {
        console.error('[Index] Error checking session:', error);
      }
    };

    // Only check session if we don't have one yet
    if (!session) {
      checkResetSession();
    }

    // Redirect based on authentication state
    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [session, loading, params.type, params.access_token, params.token_hash, pathname]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
