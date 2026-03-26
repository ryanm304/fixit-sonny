import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Constants } from '@/integrations/supabase/types';

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  priority: string;
  onPriorityChange: (v: string) => void;
};

const RequestFilters = ({ search, onSearchChange, status, onStatusChange, category, onCategoryChange, priority, onPriorityChange }: Props) => (
  <div className="flex flex-wrap gap-3 mb-6">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search requests..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9"
      />
    </div>
    <Select value={status} onValueChange={onStatusChange}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        {Constants.public.Enums.request_status.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Select value={category} onValueChange={onCategoryChange}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {Constants.public.Enums.request_category.map((c) => (
          <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Select value={priority} onValueChange={onPriorityChange}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Priorities</SelectItem>
        {Constants.public.Enums.request_priority.map((p) => (
          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default RequestFilters;
