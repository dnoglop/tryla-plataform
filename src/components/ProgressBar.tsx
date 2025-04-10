
interface ProgressBarProps {
  progress: number;
  className?: string;
}

const ProgressBar = ({ progress, className = "" }: ProgressBarProps) => {
  return (
    <div className={`progress-bar ${className}`}>
      <div 
        className="progress-value"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
