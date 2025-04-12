
import React from 'react';

interface ProgressBarProps {
  progress: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '' }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full ${className}`}>
      <div
        className="bg-trilha-orange rounded-full h-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
