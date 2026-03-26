import AIChatBubble from '@/components/AIChatBubble';
import { motion } from 'framer-motion';

const ChatPage = () => (
  <div>
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-heading font-bold mb-1">AI Assistant</h1>
      <p className="text-muted-foreground text-sm mb-6">Get help with maintenance requests</p>
    </motion.div>
    <AIChatBubble />
  </div>
);

export default ChatPage;
