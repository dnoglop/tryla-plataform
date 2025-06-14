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

  // Generate optimized positions for better visual flow
  const generatePhasePositions = (): TrailPhase[] => {
    return phases.map((phase, index) => {
      const yStep = 230; // Reduced spacing for more compact layout
      
      // Create a more dynamic zigzag pattern
      const baseX = 50;
      const xVariation = index % 3 === 0 ? -8 : index % 3 === 1 ? 8 : 0;
      
      return {
        ...phase,
        position: { x: baseX + xVariation, y: 20 + (index * yStep) }
      };
    });
  };

  const positionedPhases = generatePhasePositions();
  const containerHeight = Math.max(400, (positionedPhases.length - 1) * 180 + 200);

  const getPhaseIcon = (phase: TrailPhase) => {
    if (phase.isLocked) return <Lock className="h-5 w-5 text-muted-foreground" />;
    if (phase.status === "completed") return <CheckCircle2 className="h-5 w-5 text-primary-foreground" />;
    
    switch (phase.type) {
      case "video":
        return <Video className="h-5 w-5 text-primary-foreground" />;
      case "quiz":
        return <Star className="h-5 w-5 text-primary-foreground" />;
      case "challenge":
        return <Trophy className="h-5 w-5 text-primary-foreground" />;
      case "text":
        return <BookText className="h-5 w-5 text-primary-foreground" />;
      default:
        return <BookText className="h-5 w-5 text-primary-foreground" />;
    }
  };

  const getPhaseColors = (phase: TrailPhase) => {
    if (phase.isLocked) {
      return {
        bg: "bg-muted/30",
        border: "border-muted",
        text: "text-muted-foreground",
        iconBg: "bg-muted"
      };
    }
    
    if (phase.status === "completed") {
      return {
        bg: "bg-card",
        border: "border-primary/30",
        text: "text-card-foreground",
        iconBg: "bg-primary"
      };
    }
    
    return {
      bg: "bg-card",
      border: "border-primary/40",
      text: "text-card-foreground",
      iconBg: "bg-primary"
    };
  };

  const renderConnection = (from: TrailPhase, to: TrailPhase, index: number) => {
    const isCompleted = from.status === "completed";
    const isNext = to.status === "inProgress" || to.status === "notStarted";
    
    const fromCenterX = from.position.x;
    const fromY = from.position.y + 90;
    const toCenterX = to.position.x;
    const toY = to.position.y;
    
    const deltaX = (toCenterX - fromCenterX) * 0.01; // Convert percentage to relative units
    const deltaY = toY - fromY;
    
    // Create smooth curved path
    const pathData = `M 0,0 Q ${deltaX * 50},${deltaY * 0.3} ${deltaX * 100},${deltaY}`;
    
    return (
      <div
        key={`connection-${index}`}
        className="absolute z-0"
        style={{
          left: `${fromCenterX}%`,
          top: fromY,
          transform: "translateX(-50%)",
          width: Math.abs(deltaX * 100) || 4,
          height: deltaY,
        }}
      >
        <svg 
          width="100%" 
          height="100%" 
          className="absolute inset-0"
          style={{ overflow: 'visible' }}
        >
          <path
            d={pathData}
            stroke={isCompleted ? "hsl(var(--primary))" : "hsl(var(--muted))"}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            className={cn(
              "transition-all duration-700",
              isCompleted && isNext && "animate-pulse"
            )}
            style={{
              filter: isCompleted ? "drop-shadow(0 0 4px hsl(var(--primary) / 0.3))" : undefined
            }}
          />
          {/* Animated progress dot */}
          {isCompleted && isNext && (
            <circle
              r="3"
              fill="hsl(var(--primary))"
              className="animate-pulse"
              style={{
                transformOrigin: '0 0',
                animation: 'dash 2s linear infinite'
              }}
            >
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                path={pathData}
              />
            </circle>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className={cn("relative bg-gradient-to-b from-background to-muted/20", className)}>
      {/* Simplified header - removed redundant progress */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border/50 p-3">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border border-border/50">
            <div className="flex items-center justify-center w-4 h-4 bg-primary rounded-full">
              <Award className="h-2 w-2 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold text-primary">
              {phases.filter(p => p.status === "completed").length} de {phases.length} concluídas
            </span>
          </div>
        </div>
      </div>

      {/* Optimized trail container */}
      <div 
        className="relative px-4 py-6 overflow-hidden" 
        style={{ height: containerHeight }}
      >
        {/* Render connections with smooth curves */}
        {positionedPhases.slice(0, -1).map((phase, index) => {
          const nextPhase = positionedPhases[index + 1];
          return renderConnection(phase, nextPhase, index);
        })}

        {/* Render phase cards */}
        {positionedPhases.map((phase, index) => {
          const colors = getPhaseColors(phase);
          const isPressed = pressedPhase === index;
          const isHovered = hoveredPhase === index;
          const isActive = phase.status === "inProgress";
          
          return (
            <div
              key={phase.id}
              className="absolute z-10"
              style={{
                top: phase.position.y,
                left: `${phase.position.x}%`,
                transform: "translateX(-50%)",
                width: "240px" // Slightly smaller for better mobile experience
              }}
            >
              {/* Phase number badge */}
              <div className={cn(
                "absolute -left-2 top-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-20 border-2 transition-all duration-300",
                phase.status === "completed" 
                  ? "bg-primary text-primary-foreground border-primary-foreground" 
                  : isActive
                    ? "bg-primary text-primary-foreground border-primary-foreground animate-pulse"
                    : "bg-card text-muted-foreground border-card"
              )}>
                {phase.status === "completed" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  index + 1
                )}
              </div>

              <div
                className={cn(
                  "relative rounded-2xl transition-all duration-300 overflow-hidden select-none backdrop-blur-sm",
                  colors.bg,
                  colors.border,
                  "border-2",
                  !phase.isLocked && "cursor-pointer",
                  phase.isLocked && "opacity-60 cursor-not-allowed",
                  // Enhanced 3D effects
                  !phase.isLocked && !isPressed && "shadow-lg hover:shadow-xl",
                  !phase.isLocked && isPressed && "shadow-md transform scale-[0.98]",
                  !phase.isLocked && isHovered && !isPressed && "transform scale-[1.02] shadow-xl",
                  // Special styling for active phase
                  isActive && "ring-2 ring-primary/20 shadow-primary/10",
                )}
                onClick={() => !phase.isLocked && onPhaseClick(phase)}
                onMouseEnter={() => setHoveredPhase(index)}
                onMouseLeave={() => {
                  setHoveredPhase(null);
                  setPressedPhase(null);
                }}
                onMouseDown={() => !phase.isLocked && setPressedPhase(index)}
                onMouseUp={() => setPressedPhase(null)}
              >
                {/* Status indicator */}
                <div className="absolute top-2 right-2 z-20">
                  {phase.status === "completed" && (
                    <div className="w-3 h-3 bg-primary rounded-full flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="h-2 w-2 text-primary-foreground" />
                    </div>
                  )}
                  {isActive && (
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-sm" />
                  )}
                </div>

                {/* Main content */}
                <div className="p-4">
                  {/* Icon */}
                  <div className="flex justify-center mb-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300",
                      colors.iconBg,
                      isHovered && !phase.isLocked && "scale-110 shadow-md",
                      isPressed && "scale-95"
                    )}>
                      {getPhaseIcon(phase)}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm text-center text-card-foreground mb-2 line-clamp-2">
                    {phase.name}
                  </h3>
                  
                  {/* Compact meta info */}
                  <div className="flex justify-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="bg-muted/50 px-2 py-1 rounded-full">
                      {phase.duration || 5}m
                    </span>
                    <span className="bg-muted/50 px-2 py-1 rounded-full capitalize">
                      {phase.type}
                    </span>
                  </div>

                  {/* Action button */}
                  {!phase.isLocked ? (
                    <button
                      className={cn(
                        "w-full py-2.5 rounded-xl font-semibold text-xs transition-all duration-300",
                        phase.status === "completed" 
                          ? "bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm hover:shadow-md"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md",
                        isPressed && "transform scale-95",
                        isActive && "animate-pulse shadow-primary/20"
                      )}
                    >
                      {phase.status === "completed" 
                        ? "✓ Revisar" 
                        : isActive
                          ? "▶ Continuar"
                          : "Iniciar"
                      }
                    </button>
                  ) : (
                    <div className="w-full py-2.5 bg-muted/50 rounded-xl text-muted-foreground font-medium text-xs text-center">
                      🔒 Bloqueado
                    </div>
                  )}
                </div>

                {/* Subtle glow effect for active phases */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};