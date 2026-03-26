import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Constants } from '@/integrations/supabase/types';
import type { Database } from '@/integrations/supabase/types';

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Database['public']['Enums']['request_status'] }) => {
      const { error } = await supabase.from('maintenance_requests').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  if (!isAdmin) {
    return (
      <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
        Access denied. Admin privileges required.
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold mb-1">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mb-6">Manage all maintenance requests</p>
      </motion.div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading">All Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{r.category}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{r.priority}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{r.status.replace('_', ' ')}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(r.created_at), 'MMM d')}</TableCell>
                  <TableCell>
                    <Select
                      value={r.status}
                      onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v as Database['public']['Enums']['request_status'] })}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Constants.public.Enums.request_status.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
