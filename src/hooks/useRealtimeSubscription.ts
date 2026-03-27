import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeRequests = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['requests'] });
          queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
};

export const useRealtimeNotifications = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient, userId]);
};
