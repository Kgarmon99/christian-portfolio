import { motion } from 'framer-motion';
import { ExternalLink, Lock, Unlock, Clock } from 'lucide-react';

interface ProjectCardProps {
  title: string;
  description: string;
  tags: string[];
  icon: React.ElementType;
  github: string;
  demo: string;
  status: 'completed' | 'in-progress' | 'planned';
}

const ProjectCard = ({ title, description, tags, icon: Icon, github, demo, status }: ProjectCardProps) => {
  const statusConfig = {
    completed: { icon: Unlock, color: 'text-[var(--accent-green)]', bg: 'bg-[var(--accent-green)]/10', label: 'Completed' },
    'in-progress': { icon: Clock, color: 'text-[var(--accent-yellow)]', bg: 'bg-[var(--accent-yellow)]/10', label: 'In Progress' },
    planned: { icon: Lock, color: 'text-[var(--accent-red)]', bg: 'bg-[var(--accent-red)]/10', label: 'Planned' },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[var(--bg-card)] rounded-lg p-6 border border-[var(--border-color)] card-hover flex flex-col"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-[var(--accent-green)]/10 rounded-lg">
          <Icon className="w-6 h-6 text-[var(--accent-green)]" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bg}`}>
          <StatusIcon className={`w-3 h-3 ${config.color}`} />
          <span className={`text-xs font-mono ${config.color}`}>{config.label}</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4 flex-1">{description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-[var(--bg-primary)] text-[var(--accent-cyan)] text-xs rounded border border-[var(--border-color)]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex gap-3 pt-4 border-t border-[var(--border-color)]">
        <a
          href={github}
          className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="font-mono">Code</span>
        </a>
        <a
          href={demo}
          className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="font-mono">Demo</span>
        </a>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
