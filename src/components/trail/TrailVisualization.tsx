
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Lock, Play, Star, Trophy, BookText, Video, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Phase, PhaseStatus } from '@/services/moduleService';

interface TrailPhase extends Phase {
  status: PhaseStatus;
  isLocked: boolean;
  position: { x: number; y: number };
}

interface TrailVisualizationProps {
  phases: TrailPhase[];
  onPhaseClick: (phase: Phase) => void;
  moduleProgress: number;
  className?: string;
}

export const TrailVisualization: React.FC<TrailVisualizationProps> = ({
  phases,
  onPhaseClick,
  moduleProgress,
  className
}) => {
  const [hoveredPhase, setHoveredPhase] = useState<number | null>(null);
  const [pressedPhase, setPressedPhase] = useState<number | null>(null);

  // Generate better spaced positions for phases
  const generatePhasePositions = (): TrailPhase[] => {
    return phases.map((phase, index) => {
      const yStep = 230; // Adjusted spacing to 280px
      const centerX = 30; // Center horizontal position
      
      // Alternating positions for visual interest
      const xVariation = index % 2 === 0 ? 45 : 55;
      
      return {
        ...phase,
        position: { x: xVariation, y: 50 + (index * yStep) }
      };
    });
  };

  const positionedPhases = generatePhasePositions();
  // Adjusted container height calculation - reduce bottom padding significantly
  const containerHeight = Math.max(400, (positionedPhases.length - 1) * 280 + 250);

  const getPhaseIcon = (phase: TrailPhase) => {
    if (phase.isLocked) return <Lock className="h-6 w-6 text-muted-foreground" />;
    if (phase.status === "completed") return <CheckCircle2 className="h-6 w-6 text-primary-foreground" />;
    
    switch (phase.type) {
      case "video":
        return <Video className="h-6 w-6 text-primary-foreground" />;
      case "quiz":
        return <Star className="h-6 w-6 text-primary-foreground" />;
      case "challenge":
        return <Trophy className="h-6 w-6 text-primary-foreground" />;
      case "text":
        return <BookText className="h-6 w-6 text-primary-foreground" />;
      default:
        return <BookText className="h-6 w-6 text-primary-foreground" />;
    }
  };

  const getPhaseColors = (phase: TrailPhase) => {
    if (phase.isLocked) {
      return {
        bg: "bg-card",
        border: "border-border",
        text: "text-muted-foreground",
        iconBg: "bg-muted"
      };
    }
    
    if (phase.status === "completed") {
      return {
        bg: "bg-card",
        border: "border-primary/20",
        text: "text-card-foreground",
        iconBg: "bg-primary"
      };
    }
    
    return {
      bg: "bg-card",
      border: "border-primary/20",
      text: "text-card-foreground",
      iconBg: "bg-primary"
    };
  };

  const renderConnection = (from: TrailPhase, to: TrailPhase, index: number) => {
    const isActive = from.status === "completed";
    const fromY = from.position.y + 100; // Adjusted for new card height
    const toY = to.position.y;
    const height = toY - fromY;
    
    return (
      <div
        key={`connection-${index}`}
        className="absolute left-1/2 transform -translate-x-1/2 z-0"
        style={{
          top: fromY,
          height: height,
          width: "3px"
        }}
      >
        <div className={cn(
          "w-full h-full transition-all duration-700 rounded-full",
          isActive ? "bg-primary" : "bg-muted"
        )}>
          {isActive && (
            <div className="w-full h-full bg-primary/60 animate-pulse opacity-60 rounded-full" />
          )}
        </div>
      </div>
    );
  };

  const handleMouseDown = (index: number) => {
    setPressedPhase(index);
  };

  const handleMouseUp = () => {
    setPressedPhase(null);
  };

  const handleMouseLeave = (index: number) => {
    setHoveredPhase(null);
    setPressedPhase(null);
  };

  return (
    <div className={cn("min-h-screen bg-background pb-8", className)}>
      {/* Header with progress - Smaller size */}
      <div className="relative z-20 p-4 text-center bg-background">
        <div className="inline-flex items-center gap-2 bg-card rounded-lg px-4 py-2 shadow-md border border-border">
          <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
            <Award className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-primary">
            {Math.round(moduleProgress)}% Concluído
          </span>
        </div>
      </div>

      {/* Trail container */}
      <div className="relative px-2 overflow-hidden bg-background" style={{ height: containerHeight }}>
        {/* Render connections */}
        {positionedPhases.slice(0, -1).map((phase, index) => {
          const nextPhase = positionedPhases[index + 1];
          return renderConnection(phase, nextPhase, index);
        })}

        {/* Render phase cards */}
        {positionedPhases.map((phase, index) => {
          const colors = getPhaseColors(phase);
          const isPressed = pressedPhase === index;
          const isHovered = hoveredPhase === index;
          
          return (
            <div
              key={phase.id}
              className="absolute left-1/2 transform -translate-x-1/2 z-10"
              style={{
                top: phase.position.y,
                left: `${phase.position.x}%`,
                transform: "translateX(-50%)",
                width: "260px" // Increased width from 200px to 260px
              }}
            >
              <div
                className={cn(
                  "relative rounded-xl transition-all duration-300 overflow-hidden select-none",
                  colors.bg,
                  colors.border,
                  "border-2",
                  !phase.isLocked && "cursor-pointer",
                  phase.isLocked && "opacity-70 cursor-not-allowed",
                  // Shadow and 3D effects
                  !phase.isLocked && !isPressed && "shadow-lg hover:shadow-xl",
                  !phase.isLocked && isPressed && "shadow-md transform scale-95",
                  !phase.isLocked && isHovered && !isPressed && "transform scale-105",
                )}
                onClick={() => !phase.isLocked && onPhaseClick(phase)}
                onMouseEnter={() => setHoveredPhase(index)}
                onMouseLeave={() => handleMouseLeave(index)}
                onMouseDown={() => !phase.isLocked && handleMouseDown(index)}
                onMouseUp={handleMouseUp}
                style={{
                  boxShadow: isPressed 
                    ? "0 2px 8px hsl(var(--primary) / 0.1), inset 0 1px 2px rgba(0,0,0,0.05)"
                    : isHovered
                    ? "0 8px 20px hsl(var(--primary) / 0.15), 0 2px 6px rgba(0,0,0,0.05)"
                    : "0 4px 12px hsl(var(--primary) / 0.1), 0 1px 4px rgba(0,0,0,0.04)",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                {/* Status indicator */}
                <div className="absolute top-2 right-2 z-20">
                  {phase.status === "completed" && (
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-md">
                      <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  {phase.status === "inProgress" && (
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center animate-pulse shadow-md">
                      <Play className="h-2 w-2 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Main icon */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shadow-md transition-all duration-300",
                    colors.iconBg,
                    isHovered && !phase.isLocked && "scale-110 shadow-lg",
                    isPressed && "scale-95"
                  )}>
                    {getPhaseIcon(phase)}
                  </div>
                </div>

                {/* Simplified card content - only title, minutes, format and button */}
                <div className="px-3 pb-3 text-center">
                  <h3 className="font-bold text-sm text-card-foreground mb-2">
                    {phase.name}
                  </h3>
                  
                  {/* Meta info - minutes and format only */}
                  <div className="flex justify-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                      {phase.duration || 5} min
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                      {phase.type}
                    </span>
                  </div>

                  {/* Action button */}
                  {!phase.isLocked && (
                    <button
                      className={cn(
                        "w-full py-2 rounded-lg font-semibold text-xs transition-all duration-300 shadow-sm",
                        phase.status === "completed" 
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-md"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-md",
                        isPressed && "transform scale-95"
                      )}
                    >
                      {phase.status === "completed" 
                        ? "Revisar" 
                        : phase.status === "inProgress"
                          ? "Continuar"
                          : "Iniciar"
                      }
                    </button>
                  )}
                  
                  {phase.isLocked && (
                    <div className="w-full py-2 bg-muted rounded-lg text-muted-foreground font-semibold text-xs">
                      Complete a fase anterior
                    </div>
                  )}
                </div>

                {/* Shine effect for active phases */}
                {(phase.status === "inProgress" || phase.status === "completed") && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent animate-pulse opacity-30" />
                )}
              </div>

              {/* Phase number badge */}
              <div className="absolute -left-3 top-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xs shadow-md z-20 border-2 border-card">
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
