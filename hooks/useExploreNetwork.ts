import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface NetworkProfile {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  location: string | null;
  bio: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
  // Founder-specific
  venture_name: string | null;
  venture_description: string | null;
  venture_industry: string | null;
  venture_stage: string | null;
  // Investor-specific
  investment_focus: string | null;
  investment_range: string | null;
  investment_type: string | null;
  investment_firm: string | null;
  investment_industries: string[] | null;
  portfolio_size: string | null;
  // Expert-specific
  expertise_areas: string[] | null;
  years_experience: number | null;
  hourly_rate: number | null;
  created_at: string;
}

export interface StartupProfile {
  id: string;
  owner_id: string;
  name: string;
  company_name: string; // Alias for 'name'
  description: string | null;
  problem_statement: string | null; // Alias for 'description'
  industry: string | null;
  stage: string | null;
  funding_stage: string | null; // Alias for 'stage'
  location: string | null;
  website: string | null;
  is_public: boolean;
  pitch_deck_url: string | null;
  pitch_video_url: string | null;
  created_at: string;
  owner?: NetworkProfile;
}

export interface NetworkFilters {
  role?: 'founder' | 'investor' | 'expert';
  industry?: string;
  stage?: string;
  location?: string;
  search?: string;
}

export function useExploreNetwork(initialFilters?: NetworkFilters) {
  const { user, profile } = useAuth();
  const [profiles, setProfiles] = useState<NetworkProfile[]>([]);
  const [startupProfiles, setStartupProfiles] = useState<StartupProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NetworkFilters>({});

  // Update filters when initialFilters change
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters?.search, initialFilters?.industry, initialFilters?.stage, initialFilters?.location]);

  const fetchProfiles = useCallback(async () => {
    if (!user?.id || !profile?.role) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Determine which profiles to fetch based on current user's role
      let targetRoles: string[] = [];
      
      if (profile.role === 'founder' || profile.role === 'cofounder') {
        // Founders see investors
        targetRoles = ['investor'];
      } else if (profile.role === 'investor') {
        // Investors see founders and cofounders
        targetRoles = ['founder', 'cofounder'];
      } else if (profile.role === 'expert') {
        // Experts see both founders and investors
        // If role filter is set, use it; otherwise show all
        if (filters.role) {
          if (filters.role === 'founder') {
            targetRoles = ['founder', 'cofounder'];
          } else {
            targetRoles = [filters.role];
          }
        } else {
          targetRoles = ['founder', 'cofounder', 'investor', 'expert'];
        }
      }

      if (targetRoles.length === 0) {
        setProfiles([]);
        setStartupProfiles([]);
        setLoading(false);
        return;
      }

      // Build query for profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id) // Exclude current user
        .in('role', targetRoles);

      // Apply additional filters
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.industry) {
        query = query.ilike('venture_industry', `%${filters.industry}%`);
      }

      if (filters.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,` +
          `venture_name.ilike.%${filters.search}%,` +
          `bio.ilike.%${filters.search}%`
        );
      }

      const { data: profilesData, error: profilesError } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (profilesError) throw profilesError;

      setProfiles(profilesData || []);

      // If investor, also fetch startup profiles with founder info
      if (profile.role === 'investor') {
        let startupQuery = supabase
          .from('startup_profiles')
          .select(`
            *,
            owner:profiles!startup_profiles_owner_id_fkey(*)
          `)
          .eq('is_public', true);

        // Apply startup-specific filters
        if (filters.stage) {
          startupQuery = startupQuery.eq('stage', filters.stage);
        }

        if (filters.industry) {
          startupQuery = startupQuery.ilike('industry', `%${filters.industry}%`);
        }

        if (filters.search) {
          startupQuery = startupQuery.or(
            `name.ilike.%${filters.search}%,` +
            `description.ilike.%${filters.search}%`
          );
        }

        const { data: startupsData, error: startupsError } = await startupQuery
          .order('created_at', { ascending: false })
          .limit(50);

        if (startupsError) throw startupsError;

        // Map the data to include aliases for UI compatibility
        const mappedStartups = (startupsData || []).map(startup => ({
          ...startup,
          company_name: startup.name,
          problem_statement: startup.description,
          funding_stage: startup.stage,
          location: startup.owner?.location || null,
        }));

        setStartupProfiles(mappedStartups);
      }

    } catch (err: any) {
      console.error('Error fetching network profiles:', err);
      setError(err.message || 'Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.role, filters]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const updateFilters = useCallback((newFilters: Partial<NetworkFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    profiles,
    startups: startupProfiles, // Alias for backward compatibility
    startupProfiles,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refetch: fetchProfiles,
  };
}
