
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Lock, Play, Star, Trophy, BookText, Video, Mic, Award } from 'lucide-react';
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

  // Gerar posições das fases em formato de trilha vertical sinuosa centralizada
  const generatePhasePositions = (): TrailPhase[] => {
    return phases.map((phase, index) => {
      const yStep = 140; // Maior espaçamento vertical
      const amplitude = 100; // Maior amplitude da curva
      const centerX = 50; // Centro da tela (50% da largura)
      
      // Criar movimento sinuoso mais suave
      const x = centerX + Math.sin(index * 0.6) * amplitude;
      const y = 100 + (index * yStep);

      return {
        ...phase,
        position: { x, y }
      };
    });
  };

  const positionedPhases = generatePhasePositions();
  const containerHeight = Math.max(800, positionedPhases.length * 140 + 200);

  const getPhaseIcon = (phase: TrailPhase) => {
    if (phase.isLocked) return <Lock className="h-8 w-8 text-muted-foreground" />;
    if (phase.status === "completed") return <CheckCircle2 className="h-8 w-8 text-white" />;
    
    // Ícones específicos por tipo de lição
    switch (phase.type) {
      case "video":
        return <Video className="h-8 w-8 text-white" />;
      case "quiz":
        return <Star className="h-8 w-8 text-white" />;
      case "challenge":
        return <Trophy className="h-8 w-8 text-white" />;
      case "text":
        return <BookText className="h-8 w-8 text-white" />;
      case "audio":
        return <Mic className="h-8 w-8 text-white" />;
      default:
        return <BookText className="h-8 w-8 text-white" />;
    }
  };

  const getPhaseStyle = (phase: TrailPhase, index: number) => {
    if (phase.isLocked) {
      return {
        background: "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
        boxShadow: "0 8px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1)",
        border: "4px solid #e5e7eb",
        transform: "scale(0.9)"
      };
    }
    
    if (phase.status === "completed") {
      return {
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        boxShadow: "0 12px 30px rgba(16, 185, 129, 0.4), 0 6px 15px rgba(16, 185, 129, 0.3)",
        border: "4px solid #6ee7b7",
        transform: "scale(1.1)"
      };
    }
    
    if (phase.status === "inProgress") {
      return {
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        boxShadow: "0 12px 30px rgba(59, 130, 246, 0.4), 0 6px 15px rgba(59, 130, 246, 0.3)",
        border: "4px solid #93c5fd",
        transform: "scale(1.05)"
      };
    }
    
    return {
      background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      boxShadow: "0 10px 25px rgba(139, 92, 246, 0.3), 0 5px 12px rgba(139, 92, 246, 0.2)",
      border: "4px solid #c4b5fd"
    };
  };

  const renderConnection = (from: TrailPhase, to: TrailPhase, index: number) => {
    const isActive = from.status === "completed";
    
    // Calcular posições em porcentagem da largura do container
    const fromX = `${from.position.x}%`;
    const fromY = from.position.y + 50; // Centro do círculo
    const toX = `${to.position.x}%`;
    const toY = to.position.y - 50; // Centro do círculo
    
    // Criar path curvo mais suave
    const midY = (fromY + toY) / 2;
    const controlOffset = Math.abs(from.position.x - to.position.x) * 0.5;
    const controlX1 = `${from.position.x + (from.position.x > to.position.x ? -controlOffset : controlOffset)}%`;
    const controlX2 = `${to.position.x + (to.position.x > from.position.x ? -controlOffset : controlOffset)}%`;
    
    const pathData = `M ${fromX} ${fromY} C ${controlX1} ${midY}, ${controlX2} ${midY}, ${toX} ${toY}`;
    
    return (
      <g key={`connection-${index}`}>
        {/* Linha de fundo mais grossa */}
        <path
          d={pathData}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* Linha de progresso */}
        <path
          d={pathData}
          fill="none"
          stroke={isActive ? "#10b981" : "#cbd5e1"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={isActive ? "0" : "12,6"}
          className={`transition-all duration-700 ${isActive ? "" : "opacity-60"}`}
        />
        {/* Efeito de brilho para conexões ativas */}
        {isActive && (
          <path
            d={pathData}
            fill="none"
            stroke="url(#activeGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-pulse"
            opacity="0.8"
          />
        )}
      </g>
    );
  };

  return (
    <div className={cn("relative w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 rounded-3xl overflow-hidden", className)}>
      {/* Background pattern melhorado */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full">
          <defs>
            <pattern id="dotPattern" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="2" fill="currentColor" opacity="0.3"/>
            </pattern>
            <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="1"/>
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="1"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1"/>
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotPattern)" />
        </svg>
      </div>

      {/* Progress header melhorado */}
      <div className="relative z-10 p-8 text-center">
        <div className="inline-flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full px-6 py-3 shadow-xl border border-white/20">
          <div className="flex items-center justify-center w-6 h-6 bg-yellow-400 rounded-full">
            <Award className="h-4 w-4 text-yellow-800" />
          </div>
          <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
            {Math.round(moduleProgress)}% Concluído
          </span>
        </div>
      </div>

      {/* SVG container for trail - usando viewBox responsivo */}
      <div className="relative" style={{ height: containerHeight }}>
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox={`0 0 100 ${containerHeight}`}
          preserveAspectRatio="xMidYMin meet"
        >
          <defs>
            <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
              <feOffset dx="3" dy="6" result="offset"/>
              <feFlood floodColor="#000000" floodOpacity="0.25"/>
              <feComposite in2="offset" operator="in"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Render connections */}
          {positionedPhases.slice(0, -1).map((phase, index) => {
            const nextPhase = positionedPhases[index + 1];
            return renderConnection(phase, nextPhase, index);
          })}
        </svg>

        {/* Phase nodes - maiores e mais centralizados */}
        {positionedPhases.map((phase, index) => (
          <div key={phase.id} className="absolute">
            <button
              onClick={() => !phase.isLocked && onPhaseClick(phase)}
              disabled={phase.isLocked}
              onMouseEnter={() => setHoveredPhase(index)}
              onMouseLeave={() => setHoveredPhase(null)}
              className={cn(
                "relative w-24 h-24 rounded-full transition-all duration-500 transform-gpu",
                "hover:scale-110 active:scale-95 disabled:cursor-not-allowed",
                "flex items-center justify-center",
                hoveredPhase === index && !phase.isLocked && "scale-115 z-20"
              )}
              style={{
                left: `calc(${phase.position.x}% - 48px)`,
                top: phase.position.y - 48,
                ...getPhaseStyle(phase, index),
                filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.2))"
              }}
            >
              {getPhaseIcon(phase)}
              
              {/* Phase number badge - maior */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-slate-800 border-3 border-current rounded-full flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200 shadow-lg">
                {index + 1}
              </div>

              {/* Pulse animation for current phase */}
              {phase.status === "inProgress" && (
                <>
                  <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping"></div>
                  <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-pulse"></div>
                </>
              )}

              {/* Completion sparkle - maior */}
              {phase.status === "completed" && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="h-3 w-3 text-white fill-current" />
                </div>
              )}

              {/* Glow effect for active phases */}
              {(phase.status === "inProgress" || phase.status === "completed") && (
                <div 
                  className="absolute inset-0 rounded-full opacity-30 animate-pulse"
                  style={{
                    background: phase.status === "completed" ? 
                      "radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)" :
                      "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
                    transform: "scale(1.5)"
                  }}
                />
              )}
            </button>

            {/* Phase tooltip melhorado */}
            {hoveredPhase === index && (
              <div
                className="absolute z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/20 dark:border-slate-700/50 min-w-[160px] transform -translate-x-1/2 animate-fade-in"
                style={{
                  left: `${phase.position.x}%`,
                  top: phase.position.y - 100,
                }}
              >
                <p className="font-bold text-base text-slate-800 dark:text-slate-200 text-center">
                  {phase.name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 capitalize flex items-center justify-center gap-2">
                  {getPhaseIcon({ ...phase, status: "notStarted", isLocked: false })}
                  {phase.duration || 5} min • {phase.type}
                </p>
                {phase.isLocked && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 text-center mt-2 font-medium">
                    Complete a fase anterior
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
