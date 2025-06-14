
import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
  variant?: 'dots' | 'line' | 'minimal';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  className,
  variant = 'dots'
}) => {
  if (variant === 'dots') {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              i < currentStep
                ? "bg-primary scale-110"
                : i === currentStep
                  ? "bg-primary/60 scale-125"
                  : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === 'line') {
    const progress = ((currentStep + 1) / totalSteps) * 100;
    return (
      <div className={cn("w-full bg-muted rounded-full h-1", className)}>
        <div
          className="bg-primary h-1 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  }

  // Minimal variant
  return (
    <div className={cn("text-xs text-muted-foreground font-medium", className)}>
      {currentStep + 1} de {totalSteps}
    </div>
  );
};
