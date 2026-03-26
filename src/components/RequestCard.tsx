import { Tables } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Request = Tables<'maintenance_requests'>;

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  in_progress: 'bg-info/10 text-info border-info/30',
  completed: 'bg-success/10 text-success border-success/30',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

const RequestCard = ({ request }: { request: Request }) => (
  <Card className="glass-card hover:shadow-lg transition-shadow">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <CardTitle className="text-base font-heading">{request.title}</CardTitle>
        <Badge className={cn('text-xs border', statusColors[request.status])}>
          {request.status.replace('_', ' ')}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {request.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="text-xs capitalize">{request.category}</Badge>
        <Badge className={cn('text-xs', priorityColors[request.priority])}>
          {request.priority}
        </Badge>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
        {request.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {request.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {format(new Date(request.created_at), 'MMM d, yyyy')}
        </span>
      </div>
    </CardContent>
  </Card>
);

export default RequestCard;
