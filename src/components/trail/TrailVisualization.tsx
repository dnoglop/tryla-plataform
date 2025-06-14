
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

  // Generate positions for phases in a curved path
  const generatePhasePositions = (): TrailPhase[] => {
    return phases.map((phase, index) => {
      const centerX = 50;
      const baseY = 160;
      const verticalSpacing = 320; // Increased spacing to prevent overlap
      
      // Create a subtle S-curve effect
      const curveAmplitude = 15;
      const curveFreq = 0.8;
      const xOffset = Math.sin(index * curveFreq) * curveAmplitude;
      
      return {
        ...phase,
        position: { 
          x: centerX + xOffset, 
          y: baseY + (index * verticalSpacing) 
        }
      };
    });
  };

  const positionedPhases = generatePhasePositions();
  const containerHeight = Math.max(1200, positionedPhases.length * 320 + 500);

  const getPhaseIcon = (phase: TrailPhase) => {
    if (phase.isLocked) return <Lock className="h-5 w-5 text-gray-400" />;
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
        cardBg: "bg-white/60",
        border: "border-gray-200",
        iconBg: "bg-gray-300",
        buttonBg: "bg-gray-200 text-gray-500"
      };
    }
    
    if (phase.status === "completed") {
      return {
        cardBg: "bg-white",
        border: "border-orange-200",
        iconBg: "bg-gradient-to-br from-orange-400 to-orange-500",
        buttonBg: "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
      };
    }
    
    return {
      cardBg: "bg-white",
      border: "border-orange-300",
      iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
      buttonBg: "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
    };
  };

  const renderConnection = (from: TrailPhase, to: TrailPhase, index: number) => {
    const isActive = from.status === "completed";
    const fromX = from.position.x;
    const fromY = from.position.y + 120;
    const toX = to.position.x;
    const toY = to.position.y - 20;
    
    const midY = (fromY + toY) / 2;
    const controlX1 = fromX;
    const controlY1 = midY - 30;
    const controlX2 = toX;  
    const controlY2 = midY + 30;
    
    const pathD = `M ${fromX} ${fromY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${toX} ${toY}`;
    
    return (
      <svg
        key={`connection-${index}`}
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isActive ? "#fb923c" : "#d1d5db"} />
            <stop offset="100%" stopColor={isActive ? "#ea580c" : "#9ca3af"} />
          </linearGradient>
          
          {isActive && (
            <filter id={`glow-${index}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )}
        </defs>
        
        <path
          d={pathD}
          stroke={`url(#gradient-${index})`}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          filter={isActive ? `url(#glow-${index})` : undefined}
          className={isActive ? "animate-pulse" : ""}
          style={{
            opacity: isActive ? 0.9 : 0.4,
            transition: "all 0.5s ease-in-out"
          }}
        />
        
        {isActive && (
          <circle r="4" fill="#fb923c" className="animate-pulse">
            <animateMotion dur="3s" repeatCount="indefinite">
              <mpath href={`#path-${index}`}/>
            </animateMotion>
          </circle>
        )}
      </svg>
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
    <div className={cn("min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 relative overflow-hidden", className)}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200/20 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-orange-300/15 rounded-full blur-lg"></div>
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-orange-100/30 rounded-full blur-2xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-20 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-4 bg-white/90 backdrop-blur-md rounded-2xl px-8 py-4 shadow-lg border border-orange-200/50">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl shadow-md">
            <Award className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-800 mb-1">
              {Math.round(moduleProgress)}% Concluído
            </div>
            <div className="w-32 h-2 bg-orange-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${moduleProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trail container */}
      <div className="relative px-8" style={{ height: containerHeight }}>
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
              className="absolute z-10 transition-all duration-300"
              style={{
                top: phase.position.y,
                left: `${phase.position.x}%`,
                transform: `translateX(-50%) ${isHovered && !phase.isLocked ? 'translateY(-4px)' : ''} ${isPressed ? 'scale(0.98)' : isHovered && !phase.isLocked ? 'scale(1.02)' : ''}`,
                width: "280px"
              }}
            >
              <div
                className={cn(
                  "relative rounded-2xl transition-all duration-300 overflow-hidden backdrop-blur-sm border-2",
                  colors.cardBg,
                  colors.border,
                  !phase.isLocked && "cursor-pointer hover:shadow-xl",
                  phase.isLocked && "cursor-not-allowed opacity-70"
                )}
                onClick={() => !phase.isLocked && onPhaseClick(phase)}
                onMouseEnter={() => setHoveredPhase(index)}
                onMouseLeave={() => handleMouseLeave(index)}
                onMouseDown={() => !phase.isLocked && handleMouseDown(index)}
                onMouseUp={handleMouseUp}
                style={{
                  boxShadow: isPressed 
                    ? "0 4px 20px rgba(251, 146, 60, 0.15), inset 0 2px 4px rgba(0,0,0,0.06)"
                    : isHovered && !phase.isLocked
                    ? "0 12px 40px rgba(251, 146, 60, 0.2), 0 4px 16px rgba(0,0,0,0.08)"
                    : "0 4px 20px rgba(251, 146, 60, 0.1), 0 2px 8px rgba(0,0,0,0.04)"
                }}
              >
                {/* Status indicator */}
                <div className="absolute top-4 right-4 z-20">
                  {phase.status === "completed" && (
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {phase.status === "inProgress" && (
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                      <Play className="h-3 w-3 text-white ml-0.5" />
                    </div>
                  )}
                </div>

                {/* Phase number badge */}
                <div className="absolute -left-3 top-6 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg z-20 border-3 border-white">
                  {index + 1}
                </div>

                {/* Main content */}
                <div className="p-6 pt-8">
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300",
                      colors.iconBg,
                      isHovered && !phase.isLocked && "scale-110 shadow-xl"
                    )}>
                      {getPhaseIcon(phase)}
                    </div>
                  </div>

                  {/* Text content */}
                  <div className="text-center mb-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-2 leading-tight">
                      {phase.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {phase.description || "Conceitos básicos"}
                    </p>
                    
                    {/* Meta info */}
                    <div className="flex justify-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                        <div className="w-1 h-1 bg-orange-400 rounded-full" />
                        {phase.duration || 5}min
                      </span>
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full capitalize">
                        <div className="w-1 h-1 bg-orange-400 rounded-full" />
                        {phase.type}
                      </span>
                    </div>
                  </div>

                  {/* Action button */}
                  {!phase.isLocked ? (
                    <button
                      className={cn(
                        "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg",
                        colors.buttonBg,
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
                  ) : (
                    <div className="w-full py-3 bg-gray-200 rounded-xl text-gray-500 font-semibold text-sm text-center">
                      Complete a fase anterior
                    </div>
                  )}
                </div>

                {/* Shine effect for active phases */}
                {(phase.status === "inProgress" || (isHovered && !phase.isLocked)) && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse opacity-50" />
                )}
              </div>
            </div>
          );
        })}

        {/* Final completion badge */}
        {positionedPhases.length > 0 && (
          <div 
            className="absolute z-10 flex justify-center"
            style={{
              top: positionedPhases[positionedPhases.length - 1]?.position.y + 280 || 1000,
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-xl border-4 border-white">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6" />
                <span className="font-bold text-lg">Módulo Completo!</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
