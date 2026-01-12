import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { FundingOpportunity, FilterOptions } from '@/types/funding';

interface FundingRequestRow {
  id: string;
  startup_id: string;
  founder_id: string;
  title: string | null;
  amount_requested: number | null;
  currency: string;
  status: string;
  pitch_material_id: string | null;
  created_at: string;
  updated_at: string;
  startup: {
    id: string;
    owner_id: string;
    name: string;
    description: string | null;
    industry: string | null;
    stage: string | null;
    website: string | null;
    is_public: boolean;
    pitch_deck_url: string | null;
    pitch_video_url: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  founder: {
    id: string;
    full_name: string | null;
    email: string | null;
    location: string | null;
    linkedin_url: string | null;
    bio: string | null;
  } | null;
  pitch_material: {
    id: string;
    type: 'deck' | 'video';
    url: string | null;
    filename: string | null;
    pages: number | null;
    visibility: string;
  } | null;
}

export function useFundingOpportunities() {
  const { user, profile } = useAuth();
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    industries: [],
    stages: [],
    statuses: [],
    minAmount: 0,
    maxAmount: 20000000,
    minValuation: 0,
    maxValuation: 100000000,
  });

  const isInvestor = profile?.role === 'investor';
  const isFounder = profile?.role === 'founder' || profile?.role === 'cofounder';

  // Map database status to FundingOpportunity status
  const mapStatus = (status: string): 'active' | 'funded' | 'closed' => {
    switch (status) {
      case 'pending':
      case 'reviewed':
      case 'interested':
      case 'meeting_scheduled':
        return 'active';
      case 'funded':
        return 'funded';
      case 'declined':
        return 'closed';
      default:
        return 'active';
    }
  };

  // Map database stage to FundingOpportunity stage
  const mapStage = (stage: string | null): 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'series-c' => {
    if (!stage) return 'seed';
    const lower = stage.toLowerCase();
    if (lower.includes('pre-seed') || lower.includes('preseed')) return 'pre-seed';
    if (lower.includes('seed')) return 'seed';
    if (lower.includes('series-a') || lower.includes('series a')) return 'series-a';
    if (lower.includes('series-b') || lower.includes('series b')) return 'series-b';
    if (lower.includes('series-c') || lower.includes('series c')) return 'series-c';
    return 'seed';
  };

  // Map database industry to FundingOpportunity industry
  const mapIndustry = (industry: string | null): 'saas' | 'fintech' | 'healthtech' | 'edtech' | 'ecommerce' | 'ai' | 'blockchain' | 'other' => {
    if (!industry) return 'other';
    const lower = industry.toLowerCase();
    if (lower.includes('saas') || lower.includes('software')) return 'saas';
    if (lower.includes('fintech') || lower.includes('finance') || lower.includes('financial')) return 'fintech';
    if (lower.includes('healthtech') || lower.includes('health') || lower.includes('medical')) return 'healthtech';
    if (lower.includes('edtech') || lower.includes('education') || lower.includes('learning')) return 'edtech';
    if (lower.includes('ecommerce') || lower.includes('e-commerce') || lower.includes('retail')) return 'ecommerce';
    if (lower.includes('ai') || lower.includes('artificial intelligence') || lower.includes('machine learning')) return 'ai';
    if (lower.includes('blockchain') || lower.includes('crypto') || lower.includes('web3')) return 'blockchain';
    return 'other';
  };

  // Fetch funding opportunities from database
  const fetchOpportunities = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let query = supabase
        .from('funding_requests')
        .select(`
          id,
          startup_id,
          founder_id,
          title,
          amount_requested,
          currency,
          status,
          pitch_material_id,
          pitch_video_id,
          valuation,
          equity_percentage,
          revenue,
          growth_rate,
          min_investment,
          max_investment,
          team_size,
          mrr,
          arr,
          users_count,
          customers_count,
          created_at,
          updated_at,
          startup:startup_profiles!inner(
            id,
            owner_id,
            name,
            description,
            industry,
            stage,
            website,
            is_public,
            pitch_deck_url,
            pitch_video_url,
            created_at,
            updated_at
          ),
          founder:profiles!funding_requests_founder_id_fkey(
            id,
            full_name,
            email,
            location,
            linkedin_url,
            bio
          ),
          pitch_material:pitch_materials!funding_requests_pitch_material_id_fkey(
            id,
            type,
            url,
            filename,
            pages,
            visibility
          ),
          pitch_video:pitch_materials!funding_requests_pitch_video_id_fkey(
            id,
            type,
            url,
            filename,
            visibility
          )
        `)
        .order('created_at', { ascending: false });

      // Role-based filtering
      if (isFounder) {
        // Founders see only their own funding requests
        query = query.eq('founder_id', user.id);
      } else if (isInvestor) {
        // Investors see all funding requests - visibility will be filtered by pitch material visibility
        // No additional query filter needed here
      } else {
        // Other roles see nothing
        setOpportunities([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching funding opportunities:', error);
        setOpportunities([]);
        setLoading(false);
        return;
      }

      console.log(`[useFunding] Fetched ${(data as any[] || []).length} funding requests for ${isInvestor ? 'investor' : isFounder ? 'founder' : 'other'}`);

      // Fetch raised amounts for all requests in parallel
      const requestIds = (data as any[] || []).map((row: any) => row.id);
      const raisedAmountsMap = new Map<string, number>();
      
      if (requestIds.length > 0) {
        try {
          const { data: allInterests } = await supabase
            .from('investor_interest')
            .select('funding_request_id, interest_amount')
            .in('funding_request_id', requestIds)
            .in('status', ['pending', 'confirmed']);
          
          if (allInterests) {
            allInterests.forEach((interest: any) => {
              const requestId = interest.funding_request_id;
              const amount = Number(interest.interest_amount || 0);
              raisedAmountsMap.set(requestId, (raisedAmountsMap.get(requestId) || 0) + amount);
            });
          }
        } catch (err) {
          console.error('Error fetching raised amounts:', err);
        }
      }

      // Transform database rows to FundingOpportunity format
      const transformed: FundingOpportunity[] = (data as any[] || [])
        .filter((row: any) => {
          // Handle Supabase join results (can be arrays or objects)
          const startup = Array.isArray(row.startup) ? row.startup[0] : row.startup;
          if (!startup) {
            console.log(`[useFunding] Filtering out request ${row.id} - no startup profile`);
            return false;
          }
          
          // For investors, show all funding requests (no visibility filter)
          // Investors can see all requests regardless of pitch material visibility
          return true;
        })
        .map((row: any): FundingOpportunity => {
          // Handle Supabase join results (can be arrays or objects)
          const startup = Array.isArray(row.startup) ? row.startup[0] : row.startup;
          const founder = Array.isArray(row.founder) ? row.founder[0] : row.founder;
          const pitchMaterial = Array.isArray(row.pitch_material) ? row.pitch_material[0] : row.pitch_material;
          const pitchVideo = Array.isArray(row.pitch_video) ? row.pitch_video[0] : row.pitch_video;

          // Get raised amount from map
          const targetAmount = Number(row.amount_requested) || 0;
          const raisedAmount = raisedAmountsMap.get(row.id) || 0;

          // Get pitch deck info
          const pitchDeck = pitchMaterial && (pitchMaterial.type === 'deck' || !pitchMaterial.type) ? {
            id: pitchMaterial.id,
            url: pitchMaterial.url || '',
            filename: pitchMaterial.filename || 'Pitch Deck',
            pages: pitchMaterial.pages || 0,
            uploadedAt: row.created_at,
          } : undefined;

          // Get video URL from pitch_video or pitch_material if type is video
          let videoUrl: string | undefined = undefined;
          if (pitchVideo && pitchVideo.type === 'video') {
            videoUrl = pitchVideo.url || undefined;
          } else if (pitchMaterial && pitchMaterial.type === 'video') {
            videoUrl = pitchMaterial.url || undefined;
          } else if (startup.pitch_video_url) {
            videoUrl = startup.pitch_video_url;
          }

          // Get founder info
          const founders = founder ? [{
            id: founder.id,
            name: founder.full_name || 'Founder',
            role: 'Founder',
            linkedin: founder.linkedin_url || undefined,
          }] : [];

          // Create highlights from description and other data
          const highlights: string[] = [];
          if (startup.description) {
            // Extract key points from description (simplified)
            const sentences = startup.description.split('.').filter((s: string) => s.trim().length > 20);
            highlights.push(...sentences.slice(0, 4).map((s: string) => s.trim()));
          }

          // Calculate deadline (30 days from creation for active requests)
          const deadline = new Date(new Date(row.created_at).getTime() + 30 * 24 * 60 * 60 * 1000);

          // Map to FundingOpportunity with real data from database
          return {
            id: row.id,
            company_name: startup.name || 'Unnamed Startup',
            tagline: row.title || startup.description?.substring(0, 100) || 'Innovative startup',
            description: startup.description || 'No description available.',
            industry: mapIndustry(startup.industry),
            stage: mapStage(startup.stage),
            status: mapStatus(row.status),
            target_amount: targetAmount,
            raised_amount: raisedAmount,
            min_investment: Number(row.min_investment) || (targetAmount * 0.01),
            max_investment: Number(row.max_investment) || (targetAmount * 0.1),
            valuation: Number(row.valuation) || (targetAmount * 5),
            equity_offered: Number(row.equity_percentage) || 20,
            deadline: deadline.toISOString(),
            location: founder.location || 'Location not specified',
            founded_year: new Date(startup.created_at).getFullYear(),
            team_size: Number(row.team_size) || 1,
            revenue: Number(row.revenue) || 0,
            growth_rate: Number(row.growth_rate) || 0,
            pitch_deck: pitchDeck,
            founders: founders,
            highlights: highlights.length > 0 ? highlights : ['Early stage startup', 'Seeking funding'],
            metrics: {
              mrr: Number(row.mrr) || undefined,
              arr: Number(row.arr) || undefined,
              users: Number(row.users_count) || undefined,
              customers: Number(row.customers_count) || undefined,
            },
            images: [],
            video_url: videoUrl,
            documents: [],
            created_at: row.created_at,
            updated_at: row.updated_at,
          };
        });

      console.log(`[useFunding] Transformed ${transformed.length} opportunities after filtering`);
      setOpportunities(transformed);
    } catch (err) {
      console.error('Error in fetchOpportunities:', err);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isInvestor, isFounder]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Apply filters - use useMemo for better performance
  const filteredOpportunities = useMemo(() => {
    let filtered = [...opportunities];

    // Apply search filter
    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (opp) =>
          opp.company_name.toLowerCase().includes(searchLower) ||
          opp.tagline.toLowerCase().includes(searchLower) ||
          opp.description.toLowerCase().includes(searchLower) ||
          opp.industry.toLowerCase().includes(searchLower) ||
          opp.stage.toLowerCase().includes(searchLower) ||
          opp.location.toLowerCase().includes(searchLower) ||
          opp.founders.some(f => f.name.toLowerCase().includes(searchLower))
      );
    }

    // Apply industry filter
    if (filters.industries.length > 0) {
      filtered = filtered.filter((opp) => filters.industries.includes(opp.industry));
    }

    // Apply stage filter
    if (filters.stages.length > 0) {
      filtered = filtered.filter((opp) => filters.stages.includes(opp.stage));
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter((opp) => filters.statuses.includes(opp.status));
    }

    // Apply amount range filter
    filtered = filtered.filter(
      (opp) =>
        opp.target_amount >= filters.minAmount &&
        opp.target_amount <= filters.maxAmount
    );

    // Apply valuation range filter
    filtered = filtered.filter(
      (opp) =>
        opp.valuation >= filters.minValuation &&
        opp.valuation <= filters.maxValuation
    );

    return filtered;
  }, [opportunities, filters]);

  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      industries: [],
      stages: [],
      statuses: [],
      minAmount: 0,
      maxAmount: 20000000,
      minValuation: 0,
      maxValuation: 100000000,
    });
  }, []);

  const refresh = useCallback(async () => {
    await fetchOpportunities();
  }, [fetchOpportunities]);

  return {
    opportunities: filteredOpportunities,
    allOpportunities: opportunities,
    loading,
    filters,
    updateFilters,
    resetFilters,
    refresh,
  };
}
