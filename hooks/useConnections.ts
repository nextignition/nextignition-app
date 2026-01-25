import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Connection {
  id: string;
  requester_id: string;
  target_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  message: string | null;
  created_at: string;
  updated_at: string;
  requester?: any;
  target?: any;
}

export function useConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pending, setPending] = useState<Connection[]>([]);
  const [sent, setSent] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all connections where user is requester or target
      const { data, error: fetchError } = await supabase
        .from('connections')
        .select(`
          *,
          requester:requester_id(*),
          target:target_id(*)
        `)
        .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching connections:', fetchError);
        throw fetchError;
      }

      let allConnections = data || [];
      
      // If profiles weren't loaded via join, fetch them separately
      const connectionIds = allConnections.map(c => c.id);
      const userIds = new Set<string>();
      allConnections.forEach(c => {
        if (c.requester_id) userIds.add(c.requester_id);
        if (c.target_id) userIds.add(c.target_id);
      });

      // Fetch profiles if they weren't included
      if (allConnections.length > 0 && (!allConnections[0].requester || !allConnections[0].target)) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', Array.from(userIds));

        if (profilesData) {
          const profilesMap = new Map(profilesData.map(p => [p.id, p]));
          allConnections = allConnections.map(c => ({
            ...c,
            requester: c.requester || profilesMap.get(c.requester_id),
            target: c.target || profilesMap.get(c.target_id),
          }));
        }
      }
      
      // Log for debugging
      console.log('Fetched connections:', {
        total: allConnections.length,
        connections: allConnections.map(c => ({
          id: c.id,
          status: c.status,
          requester_id: c.requester_id,
          target_id: c.target_id,
          hasRequester: !!c.requester,
          hasTarget: !!c.target,
          requesterName: c.requester?.full_name || c.requester?.email,
          targetName: c.target?.full_name || c.target?.email,
        })),
      });

      // Separate into categories
      const accepted = allConnections.filter(c => c.status === 'accepted');
      const pendingReceived = allConnections.filter(
        c => c.status === 'pending' && c.target_id === user.id
      );
      const sentRequests = allConnections.filter(
        c => c.status === 'pending' && c.requester_id === user.id
      );

      setConnections(accepted);
      setPending(pendingReceived);
      setSent(sentRequests);

    } catch (err: any) {
      console.error('Error fetching connections:', err);
      setError(err.message || 'Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const sendConnectionRequest = async (
    targetId: string,
    message?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          target_id: targetId,
          status: 'pending',
          message: message || null,
        });

      if (error) throw error;

      await fetchConnections();
      return { success: true };
    } catch (err: any) {
      console.error('Error sending connection request:', err);
      return { success: false, error: err.message || 'Failed to send request' };
    }
  };

  const acceptConnection = async (
    connectionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      if (error) throw error;

      await fetchConnections();
      return { success: true };
    } catch (err: any) {
      console.error('Error accepting connection:', err);
      return { success: false, error: err.message || 'Failed to accept connection' };
    }
  };

  const rejectConnection = async (
    connectionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      if (error) throw error;

      await fetchConnections();
      return { success: true };
    } catch (err: any) {
      console.error('Error rejecting connection:', err);
      return { success: false, error: err.message || 'Failed to reject connection' };
    }
  };

  const cancelRequest = async (
    connectionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      await fetchConnections();
      return { success: true };
    } catch (err: any) {
      console.error('Error canceling request:', err);
      return { success: false, error: err.message || 'Failed to cancel request' };
    }
  };

  const getConnectionStatus = (targetId: string): 'none' | 'pending' | 'accepted' | 'sent' => {
    if (!user?.id) return 'none';

    const connection = [...connections, ...pending, ...sent].find(
      c => (c.requester_id === targetId || c.target_id === targetId)
    );

    if (!connection) return 'none';
    if (connection.status === 'accepted') return 'accepted';
    if (connection.requester_id === user.id) return 'sent';
    return 'pending';
  };

  return {
    connections,
    pending,
    sent,
    loading,
    error,
    sendConnectionRequest,
    acceptConnection,
    rejectConnection,
    cancelRequest,
    getConnectionStatus,
    refetch: fetchConnections,
  };
}
