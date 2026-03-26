import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wrench, ArrowRight, Shield, Zap, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    { icon: Zap, title: 'Fast Tracking', desc: 'Submit and track requests in real-time' },
    { icon: Shield, title: 'Role-Based Access', desc: 'Separate views for students and admins' },
    { icon: MessageCircle, title: 'AI Assistant', desc: 'Get instant help with your queries' },
  ];

  return (
    <div className="min-h-screen gradient-hero text-primary-foreground">
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-xl">MaintainAI</span>
        </div>
        <Button
          onClick={() => navigate(user ? '/dashboard' : '/auth')}
          className="gradient-accent font-semibold"
        >
          {user ? 'Dashboard' : 'Get Started'}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </nav>

      <section className="max-w-4xl mx-auto px-8 pt-24 pb-32 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-heading font-bold mb-6 leading-tight"
        >
          Maintenance Made
          <span className="text-accent"> Intelligent</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-lg text-primary-foreground/70 mb-10 max-w-2xl mx-auto"
        >
          Submit, track, and manage maintenance requests with AI-powered assistance.
          Built for schools and organizations that value efficiency.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Button
            size="lg"
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
            className="gradient-accent font-semibold text-lg px-8 py-6"
          >
            {user ? 'Go to Dashboard' : 'Start for Free'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-xl p-6 backdrop-blur-sm"
            >
              <div className="w-11 h-11 rounded-lg gradient-accent flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-primary-foreground/60">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
