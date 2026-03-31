import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Constants } from '@/integrations/supabase/types';
import type { Database } from '@/integrations/supabase/types';
import { Camera, X } from 'lucide-react';

const categories = Constants.public.Enums.request_category;

const CreateRequestForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Database['public']['Enums']['request_category']>('other');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase.from('maintenance_requests').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      location: location.trim() || null,
    }).select().single();

    if (error) {
      toast.error('Failed to create request');
      setLoading(false);
      return;
    }

    // Trigger AI prioritization in background
    try {
      await supabase.functions.invoke('ai-prioritize', {
        body: { request_id: data.id },
      });
    } catch {
      // Non-blocking - AI will run but we don't wait
    }

    toast.success('Request submitted! AI is analyzing priority...');
    navigate('/dashboard/requests');
    setLoading(false);
  };

  return (
    <Card className="glass-card max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Submit Maintenance Request</CardTitle>
        <p className="text-sm text-muted-foreground">AI will automatically analyze and assign priority</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the issue" required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide details — the more info, the better AI can prioritize..." rows={4} maxLength={1000} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Building A, Room 204" maxLength={200} />
            </div>
          </div>
          <Button type="submit" className="w-full gradient-accent font-semibold text-primary-foreground" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateRequestForm;
