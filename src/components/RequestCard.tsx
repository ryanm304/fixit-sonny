import { Tables } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MapPin, Clock, Brain } from 'lucide-react';
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
  medium: 'bg-warning/10 text-warning',
  high: 'bg-[hsl(25,90%,50%)]/10 text-[hsl(25,90%,50%)]',
  urgent: 'bg-destructive/10 text-destructive',
};

const scoreColor = (score: number) => {
  if (score >= 76) return 'text-destructive';
  if (score >= 51) return 'text-[hsl(25,90%,50%)]';
  if (score >= 26) return 'text-warning';
  return 'text-muted-foreground';
};

const scoreBarColor = (score: number) => {
  if (score >= 76) return '[&>div]:bg-destructive';
  if (score >= 51) return '[&>div]:bg-[hsl(25,90%,50%)]';
  if (score >= 26) return '[&>div]:bg-warning';
  return '[&>div]:bg-muted-foreground';
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

      {request.ai_score !== null && request.ai_score !== undefined && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Brain className="w-3 h-3" /> AI Score
            </span>
            <span className={cn('font-semibold', scoreColor(request.ai_score))}>
              {request.ai_score}/100
            </span>
          </div>
          <Progress value={request.ai_score} className={cn('h-1.5', scoreBarColor(request.ai_score))} />
        </div>
      )}

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
