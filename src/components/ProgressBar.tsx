
interface ProgressBarProps {
  progress: number;
  className?: string;
}

const ProgressBar = ({ progress, className = "" }: ProgressBarProps) => {
  return (
    <div className={`h-2 w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div 
        className="h-full bg-trilha-orange transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
