import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeRequests } from '@/hooks/useRealtimeSubscription';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowUpDown, Brain } from 'lucide-react';
import { Constants } from '@/integrations/supabase/types';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type SortField = 'ai_score' | 'created_at' | 'priority' | 'status';

const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-[hsl(25,90%,50%)]/10 text-[hsl(25,90%,50%)]',
  urgent: 'bg-destructive/10 text-destructive',
};

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<SortField>('ai_score');
  const [sortAsc, setSortAsc] = useState(false);

  useRealtimeRequests();

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

  const sorted = [...requests].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'ai_score') cmp = (a.ai_score ?? 0) - (b.ai_score ?? 0);
    else if (sortField === 'priority') cmp = (priorityOrder[a.priority] ?? 0) - (priorityOrder[b.priority] ?? 0);
    else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
    else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Database['public']['Enums']['request_status'] }) => {
      const request = requests.find(r => r.id === id);
      const { error } = await supabase.from('maintenance_requests').update({ status }).eq('id', id);
      if (error) throw error;
      if (request) {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: request.user_id,
          message: `Your request "${request.title}" status changed to ${status.replace('_', ' ')}.`,
        });
        if (notifError) console.error('Notification insert failed:', notifError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const updatePriority = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: Database['public']['Enums']['request_priority'] }) => {
      const { error } = await supabase.from('maintenance_requests').update({ priority }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      toast.success('Priority overridden');
    },
    onError: () => toast.error('Failed to update priority'),
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
        <p className="text-muted-foreground text-sm mb-6">Manage all requests — real-time updates enabled</p>
      </motion.div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading">All Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="p-0 h-auto font-medium" onClick={() => toggleSort('priority')}>
                    Priority <ArrowUpDown className="w-3 h-3 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="p-0 h-auto font-medium" onClick={() => toggleSort('ai_score')}>
                    <Brain className="w-3 h-3 mr-1" /> AI Score <ArrowUpDown className="w-3 h-3 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="p-0 h-auto font-medium" onClick={() => toggleSort('status')}>
                    Status <ArrowUpDown className="w-3 h-3 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Update Status</TableHead>
                <TableHead>Override Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{r.category}</Badge></TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', priorityColors[r.priority])}>
                      {r.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.ai_score !== null && r.ai_score !== undefined ? (
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <Progress value={r.ai_score} className="h-1.5 w-16" />
                        <span className="text-xs font-mono font-semibold">{r.ai_score}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{r.status.replace('_', ' ')}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(r.created_at), 'MMM d')}</TableCell>
                  <TableCell>
                    <Select
                      value={r.status}
                      onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v as Database['public']['Enums']['request_status'] })}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Constants.public.Enums.request_status.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.priority}
                      onValueChange={(v) => updatePriority.mutate({ id: r.id, priority: v as Database['public']['Enums']['request_priority'] })}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Constants.public.Enums.request_priority.map((p) => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
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
