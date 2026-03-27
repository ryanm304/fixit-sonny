import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeRequests } from '@/hooks/useRealtimeSubscription';
import StatCard from '@/components/StatCard';
import RequestCard from '@/components/RequestCard';
import { ClipboardList, Clock, Loader, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  useRealtimeRequests();

  const { data: requests = [] } = useQuery({
    queryKey: ['requests', user?.id, isAdmin],
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

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    inProgress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  };

  const recentRequests = requests.slice(0, 6);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {isAdmin ? 'Overview of all maintenance requests' : 'Your maintenance overview'} — updates in real time
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Requests" value={stats.total} icon={ClipboardList} variant="default" delay={0} />
        <StatCard title="Pending" value={stats.pending} icon={Clock} variant="warning" delay={0.1} />
        <StatCard title="In Progress" value={stats.inProgress} icon={Loader} variant="info" delay={0.2} />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} variant="success" delay={0.3} />
      </div>

      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">Recent Requests</h2>
        {recentRequests.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
            <p>No requests yet. Submit your first maintenance request!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentRequests.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
