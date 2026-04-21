import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import jsuLogo from '@/assets/jsu-logo.png';

const Auth = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success('Password reset email sent! Check your inbox.');
        setMode('login');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('Account created! Check your email to confirm.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src={jsuLogo} alt="JSU Logo" width={48} height={48} className="w-12 h-12 object-contain" />
            <h1 className="text-3xl font-bold font-heading text-primary-foreground">FixIt Sonny</h1>
          </div>
          <p className="text-primary-foreground/60">Smart maintenance management</p>
        </div>

        <Card className="glass-card shadow-2xl border-border/30">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-xl">
              {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' ? 'Sign in to your account' : mode === 'signup' ? 'Get started with FixIt Sonny' : 'Enter your email to receive a reset link'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />
                  </div>
                  <div className="space-y-3">
                    <Label>Account Type</Label>
                    <RadioGroup value={role} onValueChange={(v) => setRole(v as 'user' | 'admin')} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="user" id="role-student" />
                        <Label htmlFor="role-student" className="cursor-pointer font-normal">Student</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="role-admin" />
                        <Label htmlFor="role-admin" className="cursor-pointer font-normal">Admin</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                </div>
              )}
              {mode === 'login' && (
                <div className="text-right">
                  <button type="button" onClick={() => setMode('forgot')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}
              <Button type="submit" className="w-full gradient-accent font-semibold text-primary-foreground" disabled={loading}>
                {loading ? 'Loading...' : (
                  <span className="flex items-center gap-2">
                    {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
            <div className="mt-4 text-center">
              {mode === 'forgot' ? (
                <button onClick={() => setMode('login')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Back to sign in
                </button>
              ) : (
                <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
