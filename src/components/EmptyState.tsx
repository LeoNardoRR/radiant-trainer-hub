import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = ({ icon: Icon, emoji, title, description, action }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center justify-center py-16 px-6 text-center"
  >
    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center mb-5">
      {emoji ? (
        <span className="text-3xl">{emoji}</span>
      ) : (
        <Icon className="h-8 w-8 text-primary/50" strokeWidth={1.2} />
      )}
    </div>
    <h3 className="font-display font-semibold text-lg mb-1.5">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground font-body max-w-xs leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </motion.div>
);

export default EmptyState;
