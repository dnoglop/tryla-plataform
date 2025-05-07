
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showIndicator?: boolean;
  showIcon?: boolean;
  compact?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '',
  showIndicator = false,
  showIcon = false,
  compact = false
}) => {
  // Ensure progress is between 0 and 100
  const validProgress = Math.min(Math.max(0, progress), 100);
  
  return (
    <div className="relative w-full">
      {/* Progress bar */}
      <Progress 
        value={validProgress} 
        className={`h-3 rounded-full ${compact ? 'h-2' : 'h-3'} ${className}`}
      />
      
      {/* Progress indicator */}
      {showIndicator && (
        <span className="absolute right-0 -mt-6 text-xs text-gray-600">
          {validProgress}%
        </span>
      )}
      
      {/* Icon at the end of progress bar when complete */}
      {showIcon && validProgress === 100 && (
        <div className="absolute right-0 -top-1 -mr-2 bg-white rounded-full border-2 border-trilha-orange w-5 h-5 flex items-center justify-center">
          <span className="text-[10px]">🏆</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
