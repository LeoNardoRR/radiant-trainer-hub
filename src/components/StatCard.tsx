import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  index?: number;
  trend?: { value: string; positive: boolean };
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const StatCard = ({ label, value, icon: Icon, color, bg, index = 0, trend }: StatCardProps) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={fadeUp}
    custom={index}
    className="bg-card border border-border rounded-2xl p-4 md:p-5 hover:border-primary/20 hover:shadow-sm transition-all duration-300 group"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
        <Icon className={`h-[18px] w-[18px] ${color}`} strokeWidth={1.8} />
      </div>
      {trend && (
        <span className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full ${
          trend.positive ? "text-success bg-success/10" : "text-risk bg-risk/10"
        }`}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </span>
      )}
    </div>
    <p className="font-display font-bold text-2xl md:text-3xl mb-0.5 tracking-tight">{value}</p>
    <p className="text-xs text-muted-foreground font-body">{label}</p>
  </motion.div>
);

export default StatCard;
