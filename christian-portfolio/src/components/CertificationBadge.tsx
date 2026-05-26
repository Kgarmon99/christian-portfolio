import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

interface CertificationBadgeProps {
  name: string;
  status: string;
  icon: React.ElementType;
  color: 'green' | 'yellow' | 'red' | 'cyan';
}

const CertificationBadge = ({ name, status, icon: Icon, color }: CertificationBadgeProps) => {
  const colorConfig = {
    green: 'border-[var(--accent-green)] text-[var(--accent-green)] bg-[var(--accent-green)]/10',
    yellow: 'border-[var(--accent-yellow)] text-[var(--accent-yellow)] bg-[var(--accent-yellow)]/10',
    red: 'border-[var(--accent-red)] text-[var(--accent-red)] bg-[var(--accent-red)]/10',
    cyan: 'border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className={`flex items-center gap-3 p-4 rounded-lg border ${colorConfig[color]}`}
    >
      <div className={`p-2 rounded-lg bg-[var(--bg-primary)]`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs opacity-70 font-mono">{status}</div>
      </div>
      <Award className="w-5 h-5 opacity-50" />
    </motion.div>
  );
};

export default CertificationBadge;
