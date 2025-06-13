
interface ProgressBarProps {
  progress: number;
  total?: number;
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ProgressBar = ({ 
  progress, 
  total = 100, 
  showLabel = false, 
  className = "",
  size = "md"
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max((progress / total) * 100, 0), 100);
  
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3"
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Progresso</span>
          <span className="text-sm font-medium text-card-foreground">{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className={`w-full bg-muted rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
