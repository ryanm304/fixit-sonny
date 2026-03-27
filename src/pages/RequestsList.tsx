import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeRequests } from '@/hooks/useRealtimeSubscription';
import RequestCard from '@/components/RequestCard';
import RequestFilters from '@/components/RequestFilters';
import { motion } from 'framer-motion';

const RequestsList = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');

  useRealtimeRequests();

  const { data: requests = [] } = useQuery({
    queryKey: ['requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (category !== 'all' && r.category !== category) return false;
      if (priority !== 'all' && r.priority !== priority) return false;
      if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.description?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [requests, search, status, category, priority]);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold mb-1">My Requests</h1>
        <p className="text-muted-foreground text-sm mb-6">View and filter your maintenance requests — live updates enabled</p>
      </motion.div>

      <RequestFilters
        search={search} onSearchChange={setSearch}
        status={status} onStatusChange={setStatus}
        category={category} onCategoryChange={setCategory}
        priority={priority} onPriorityChange={setPriority}
      />

      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
          No requests match your filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <RequestCard request={r} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestsList;
