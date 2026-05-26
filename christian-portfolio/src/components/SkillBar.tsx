import { motion } from 'framer-motion';

interface SkillBarProps {
  name: string;
  level: number;
}

const SkillBar = ({ name, level }: SkillBarProps) => {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-[var(--text-secondary)]">{name}</span>
        <span className="text-sm font-mono text-[var(--accent-green)]">{level}%</span>
      </div>
      <div className="skill-bar">
        <motion.div
          className="skill-bar-fill"
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default SkillBar;
