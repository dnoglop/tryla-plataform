
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showIndicator?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '',
  showIndicator = false 
}) => {
  // Ensure progress is between 0 and 100
  const validProgress = Math.min(Math.max(0, progress), 100);
  
  return (
    <div className="relative">
      <Progress value={validProgress} className={`h-2 ${className}`} />
      {showIndicator && (
        <span className="absolute right-0 -mt-6 text-xs text-gray-600">
          {validProgress}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
