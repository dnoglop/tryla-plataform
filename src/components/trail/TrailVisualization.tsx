
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
      const yStep = 180; // Reduced spacing between cards
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
  const containerHeight = Math.max(800, positionedPhases.length * 180 + 200);

  const getPhaseIcon = (phase: TrailPhase) => {
    if (phase.isLocked) return <Lock className="h-6 w-6 text-gray-400" />;
    if (phase.status === "completed") return <CheckCircle2 className="h-6 w-6 text-white" />;
    
    switch (phase.type) {
      case "video":
        return <Video className="h-6 w-6 text-white" />;
      case "quiz":
        return <Star className="h-6 w-6 text-white" />;
      case "challenge":
        return <Trophy className="h-6 w-6 text-white" />;
      case "text":
        return <BookText className="h-6 w-6 text-white" />;
      default:
        return <BookText className="h-6 w-6 text-white" />;
    }
  };

  const getPhaseColors = (phase: TrailPhase) => {
    if (phase.isLocked) {
      return {
        bg: "bg-gray-100",
        border: "border-gray-200",
        text: "text-gray-500",
        iconBg: "bg-gray-300"
      };
    }
    
    if (phase.status === "completed") {
      return {
        bg: "bg-white",
        border: "border-green-200",
        text: "text-gray-800",
        iconBg: "bg-green-500"
      };
    }
    
    return {
      bg: "bg-white",
      border: "border-orange-200",
      text: "text-gray-800",
      iconBg: "bg-orange-500"
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
          isActive ? "bg-gradient-to-b from-green-400 to-green-500" : "bg-gray-300"
        )}>
          {isActive && (
            <>
              <div className="w-full h-6 bg-green-300 animate-pulse opacity-60 rounded-full" />
              <div 
                className="w-full bg-green-200 opacity-40 animate-pulse rounded-full"
                style={{
                  height: "20px",
                  animationDelay: "0.5s"
                }}
              />
            </>
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
    <div className={cn("min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 pb-24", className)}>
      {/* Header with progress */}
      <div className="relative z-20 p-6 text-center">
        <div className="inline-flex items-center gap-4 bg-white/95 backdrop-blur-sm rounded-2xl px-8 py-5 shadow-lg border border-orange-200">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-full shadow-md">
            <Award className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-orange-800">
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
                width: "280px" // Reduced from 380px
              }}
            >
              <div
                className={cn(
                  "relative rounded-2xl transition-all duration-300 overflow-hidden select-none",
                  colors.bg,
                  colors.border,
                  "border-2",
                  !phase.isLocked && "cursor-pointer",
                  phase.isLocked && "opacity-70 cursor-not-allowed",
                  // Shadow and 3D effects
                  !phase.isLocked && !isPressed && "shadow-lg hover:shadow-xl",
                  !phase.isLocked && isPressed && "shadow-md transform scale-95",
                  !phase.isLocked && isHovered && !isPressed && "transform scale-105",
                  // Soft shadow variations
                  phase.status === "completed" && "shadow-green-200/50",
                  phase.status !== "completed" && !phase.isLocked && "shadow-orange-200/50",
                )}
                onClick={() => !phase.isLocked && onPhaseClick(phase)}
                onMouseEnter={() => setHoveredPhase(index)}
                onMouseLeave={() => handleMouseLeave(index)}
                onMouseDown={() => !phase.isLocked && handleMouseDown(index)}
                onMouseUp={handleMouseUp}
                style={{
                  boxShadow: isPressed 
                    ? "0 4px 15px rgba(0,0,0,0.1), inset 0 1px 2px rgba(0,0,0,0.05)"
                    : isHovered
                    ? "0 12px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.05)"
                    : "0 6px 20px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                {/* Status indicator */}
                <div className="absolute top-3 right-3 z-20">
                  {phase.status === "completed" && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {phase.status === "inProgress" && (
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center animate-pulse shadow-md">
                      <Play className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Main icon */}
                <div className="flex justify-center pt-4 pb-3">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center shadow-md transition-all duration-300",
                    colors.iconBg,
                    isHovered && !phase.isLocked && "scale-110 shadow-lg",
                    isPressed && "scale-95"
                  )}>
                    {getPhaseIcon(phase)}
                  </div>
                </div>

                {/* Card content */}
                <div className="px-4 pb-4 text-center">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    {phase.name}
                  </h3>
                  <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {phase.description || "Conceitos básicos e princípios fundamentais para seu aprendizado"}
                  </p>
                  
                  {/* Additional info */}
                  <div className="flex justify-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      {phase.duration || 5} min
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      {phase.type}
                    </span>
                  </div>

                  {/* Action button */}
                  {!phase.isLocked && (
                    <button
                      className={cn(
                        "w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm",
                        phase.status === "completed" 
                          ? "bg-green-500 hover:bg-green-600 text-white hover:shadow-md"
                          : "bg-orange-500 hover:bg-orange-600 text-white hover:shadow-md",
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
                    <div className="w-full py-2.5 bg-gray-200 rounded-xl text-gray-500 font-semibold text-sm">
                      Complete a fase anterior
                    </div>
                  )}
                </div>

                {/* Shine effect for active phases */}
                {(phase.status === "inProgress" || phase.status === "completed") && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse opacity-30" />
                )}
              </div>

              {/* Phase number badge */}
              <div className="absolute -left-4 top-6 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md z-20 border-2 border-white">
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
