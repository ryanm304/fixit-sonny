import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { User, Building2, DoorOpen, Save } from 'lucide-react';

const ProfileSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fullName, setFullName] = useState('');
  const [dormHall, setDormHall] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, dorm_hall, room_number')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setFullName(data.full_name || '');
        setDormHall(data.dorm_hall || '');
        setRoomNumber(data.room_number || '');
      }
      setFetching(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        dorm_hall: dormHall.trim() || null,
        room_number: roomNumber.trim() || null,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated!');
    }
    setLoading(false);
  };

  if (fetching) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold mb-1">Profile Settings</h1>
        <p className="text-muted-foreground text-sm mb-6">Update your personal information</p>
      </motion.div>

      <Card className="glass-card max-w-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-xl flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Keep your details up to date so maintenance staff can reach you</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dormHall" className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Dorm Hall
                </Label>
                <Input
                  id="dormHall"
                  value={dormHall}
                  onChange={(e) => setDormHall(e.target.value)}
                  placeholder="e.g. Anderson Hall"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomNumber" className="flex items-center gap-1.5">
                  <DoorOpen className="w-3.5 h-3.5" />
                  Room Number
                </Label>
                <Input
                  id="roomNumber"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 204"
                  maxLength={20}
                />
              </div>
            </div>

            <Button type="submit" className="w-full gradient-accent font-semibold text-primary-foreground" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
