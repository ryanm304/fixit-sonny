import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpDown, Brain, Search, ShieldCheck, ShieldOff, Users } from 'lucide-react';
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

type Profile = {
  user_id: string;
  full_name: string | null;
  dorm_hall: string | null;
  room_number: string | null;
};

const AdminPanel = () => {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<SortField>('ai_score');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // User management filters
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'student'>('all');

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

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, dorm_hall, room_number');
      if (error) throw error;
      return data as Profile[];
    },
    enabled: isAdmin,
  });

  // Fetch user emails
  const { data: userEmails = [] } = useQuery({
    queryKey: ['admin-user-emails'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_emails');
      if (error) throw error;
      return data as { user_id: string; email: string }[];
    },
    enabled: isAdmin,
  });

  // Fetch all user roles for user management tab
  const { data: allRoles = [] } = useQuery({
    queryKey: ['admin-all-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const adminUserIds = useMemo(() => new Set(allRoles.filter(r => r.role === 'admin').map(r => r.user_id)), [allRoles]);

  const promoteToAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' as Database['public']['Enums']['app_role'] });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-roles'] });
      toast.success('User promoted to admin');
    },
    onError: () => toast.error('Failed to promote user'),
  });

  const demoteFromAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-roles'] });
      toast.success('Admin role removed');
    },
    onError: () => toast.error('Failed to demote user'),
  });

  const profileMap = useMemo(() => {
    const map: Record<string, Profile> = {};
    profiles.forEach(p => { map[p.user_id] = p; });
    return map;
  }, [profiles]);

  const filtered = useMemo(() => {
    let result = [...requests];

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }
    // Filter by priority
    if (filterPriority !== 'all') {
      result = result.filter(r => r.priority === filterPriority);
    }
    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter(r => r.category === filterCategory);
    }

    // Search by title, description, student name, room number, dorm hall
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => {
        const profile = profileMap[r.user_id];
        return (
          r.title.toLowerCase().includes(q) ||
          (r.description?.toLowerCase().includes(q)) ||
          (r.location?.toLowerCase().includes(q)) ||
          (profile?.full_name?.toLowerCase().includes(q)) ||
          (profile?.room_number?.toLowerCase().includes(q)) ||
          (profile?.dorm_hall?.toLowerCase().includes(q))
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'ai_score') cmp = (a.ai_score ?? 0) - (b.ai_score ?? 0);
      else if (sortField === 'priority') cmp = (priorityOrder[a.priority] ?? 0) - (priorityOrder[b.priority] ?? 0);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [requests, filterStatus, filterPriority, filterCategory, searchQuery, sortField, sortAsc, profileMap]);

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

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">Maintenance Requests</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="w-4 h-4" /> User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, room, dorm, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Constants.public.Enums.request_status.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Constants.public.Enums.request_category.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {Constants.public.Enums.request_priority.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading">All Requests ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Room</TableHead>
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
                  {filtered.map((r) => {
                    const profile = profileMap[r.user_id];
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                        <TableCell className="text-sm">
                          <div>{profile?.full_name || '—'}</div>
                          {profile?.dorm_hall && (
                            <div className="text-xs text-muted-foreground">{profile.dorm_hall}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{profile?.room_number || '—'}</TableCell>
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
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No requests match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Users className="w-5 h-5" /> User Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">Promote students to admin or revoke admin access.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Dorm Hall</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => {
                    const isCurrentUser = profile.user_id === user?.id;
                    const isProfileAdmin = adminUserIds.has(profile.user_id);
                    return (
                      <TableRow key={profile.user_id}>
                        <TableCell className="font-medium">{profile.full_name || '—'}</TableCell>
                        <TableCell className="text-sm">{profile.dorm_hall || '—'}</TableCell>
                        <TableCell className="text-sm">{profile.room_number || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={isProfileAdmin ? 'default' : 'outline'} className={isProfileAdmin ? 'bg-primary' : ''}>
                            {isProfileAdmin ? 'Admin' : 'Student'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isCurrentUser ? (
                            <span className="text-xs text-muted-foreground">Current user</span>
                          ) : isProfileAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => demoteFromAdmin.mutate(profile.user_id)}
                              className="gap-1.5 text-destructive hover:text-destructive"
                            >
                              <ShieldOff className="w-3.5 h-3.5" /> Remove Admin
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => promoteToAdmin.mutate(profile.user_id)}
                              className="gap-1.5"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Make Admin
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {profiles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
