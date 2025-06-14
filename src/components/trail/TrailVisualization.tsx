
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
      const yStep = 230; // Adjusted spacing to 230px
      const centerX = 50; // Center horizontal position
      
      // Alternating positions for visual interest
      const xVariation = index % 2 === 0 ? 45 : 55;
      
      return {
        ...phase,
        position: { x: xVariation, y: 50 + (index * yStep) }
      };
    });
  };

  const positionedPhases = generatePhasePositions();
  // Adjusted container height calculation with proper padding
  const containerHeight = Math.max(400, (positionedPhases.length - 1) * 230 + 200);

  const getPhaseIcon = (phase: TrailPhase) => {
    if (phase.isLocked) return <Lock className="h-5 w-5 text-muted-foreground" />;
    if (phase.status === "completed") return <CheckCircle2 className="h-5 w-5 text-white" />;
    
    switch (phase.type) {
      case "video":
        return <Video className="h-5 w-5 text-white" />;
      case "quiz":
        return <Star className="h-5 w-5 text-white" />;
      case "challenge":
        return <Trophy className="h-5 w-5 text-white" />;
      case "text":
        return <BookText className="h-5 w-5 text-white" />;
      default:
        return <BookText className="h-5 w-5 text-white" />;
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
        text: "text-foreground",
        iconBg: "bg-primary"
      };
    }
    
    return {
      bg: "bg-card",
      border: "border-primary/20",
      text: "text-foreground",
      iconBg: "bg-primary"
    };
  };

  const renderConnection = (from: TrailPhase, to: TrailPhase, index: number) => {
    const isActive = from.status === "completed";
    const fromY = from.position.y + 80; // Adjusted for new card height
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
          isActive ? "bg-primary" : "bg-border"
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
    <div className={cn("min-h-screen bg-background pb-6", className)}>
      {/* Header with progress - Standardized design */}
      <div className="relative z-20 p-4 text-center">
        <div className="inline-flex items-center gap-2 bg-card rounded-lg px-4 py-2 shadow-sm border">
          <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
            <Award className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            {Math.round(moduleProgress)}% Concluído
          </span>
        </div>
      </div>

      {/* Trail container */}
      <div className="relative px-4 overflow-hidden" style={{ height: containerHeight }}>
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
                width: "280px" // Increased width
              }}
            >
              <div
                className={cn(
                  "relative rounded-xl transition-all duration-300 overflow-hidden select-none",
                  colors.bg,
                  colors.border,
                  "border shadow-sm",
                  !phase.isLocked && "cursor-pointer hover:shadow-md",
                  phase.isLocked && "opacity-70 cursor-not-allowed",
                  // Standardized hover and press effects
                  !phase.isLocked && !isPressed && "hover:scale-[1.02]",
                  !phase.isLocked && isPressed && "scale-95",
                  !phase.isLocked && isHovered && !isPressed && "hover:border-primary/40",
                )}
                onClick={() => !phase.isLocked && onPhaseClick(phase)}
                onMouseEnter={() => setHoveredPhase(index)}
                onMouseLeave={() => handleMouseLeave(index)}
                onMouseDown={() => !phase.isLocked && handleMouseDown(index)}
                onMouseUp={handleMouseUp}
              >
                {/* Status indicator */}
                <div className="absolute top-3 right-3 z-20">
                  {phase.status === "completed" && (
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  {phase.status === "inProgress" && (
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center animate-pulse shadow-sm">
                      <Play className="h-2 w-2 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Main icon */}
                <div className="flex justify-center pt-4 pb-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300",
                    colors.iconBg,
                    isHovered && !phase.isLocked && "scale-105",
                    isPressed && "scale-95"
                  )}>
                    {getPhaseIcon(phase)}
                  </div>
                </div>

                {/* Card content - only title, minutes, format and button */}
                <div className="px-4 pb-4 text-center">
                  <h3 className="font-semibold text-sm text-foreground mb-3 line-clamp-2">
                    {phase.name}
                  </h3>
                  
                  {/* Meta info - minutes and format */}
                  <div className="flex justify-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                      {phase.duration || 5} min
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                      {phase.type}
                    </span>
                  </div>

                  {/* Action button - standardized design */}
                  {!phase.isLocked && (
                    <button
                      className={cn(
                        "w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200",
                        "bg-primary hover:bg-primary/90 text-primary-foreground",
                        "shadow-sm hover:shadow-md active:scale-95",
                        isPressed && "scale-95"
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
                    <div className="w-full py-2.5 bg-muted rounded-lg text-muted-foreground font-semibold text-sm">
                      Complete a fase anterior
                    </div>
                  )}
                </div>

                {/* Subtle shine effect for active phases */}
                {(phase.status === "inProgress" || phase.status === "completed") && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-60" />
                )}
              </div>

              {/* Phase number badge - standardized design */}
              <div className="absolute -left-3 top-5 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm z-20 border-2 border-background">
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
