import { Zap } from "lucide-react";

interface AppIconProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const AppIcon = ({ size = "md", className = "" }: AppIconProps) => {
  const sizeClasses = {
    sm: "w-8 h-8 rounded-[10px]",
    md: "w-10 h-10 rounded-2xl",
    lg: "w-12 h-12 rounded-2xl",
    xl: "w-16 h-16 rounded-[20px]"
  };

  const iconSizes = {
    sm: "w-[18px] h-[18px]",
    md: "w-[22px] h-[22px]",
    lg: "w-[26px] h-[26px]",
    xl: "w-[34px] h-[34px]"
  };

  return (
    <div 
      className={`overflow-hidden flex items-center justify-center shadow-lg shrink-0 ${sizeClasses[size]} ${className}`} 
      style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}
    >
      <Zap className={`text-white fill-white ${iconSizes[size]}`} strokeWidth={2} />
    </div>
  );
};
