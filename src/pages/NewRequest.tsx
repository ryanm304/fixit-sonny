import CreateRequestForm from '@/components/CreateRequestForm';
import { motion } from 'framer-motion';

const NewRequest = () => (
  <div>
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-heading font-bold mb-1">New Request</h1>
      <p className="text-muted-foreground text-sm mb-6">Submit a new maintenance request</p>
    </motion.div>
    <CreateRequestForm />
  </div>
);

export default NewRequest;
