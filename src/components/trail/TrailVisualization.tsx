
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Lock, Play, Star, Trophy, Zap } from 'lucide-react';
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

  // Gerar posições das fases em formato de trilha vertical sinuosa
  const generatePhasePositions = (): TrailPhase[] => {
    return phases.map((phase, index) => {
      const yStep = 120; // Espaçamento vertical entre fases
      const amplitude = 80; // Amplitude da curva horizontal
      const centerX = 200;
      
      // Criar movimento sinuoso
      const x = centerX + Math.sin(index * 0.8) * amplitude;
      const y = 80 + (index * yStep);

      return {
        ...phase,
        position: { x, y }
      };
    });
  };

  const positionedPhases = generatePhasePositions();
  const containerHeight = Math.max(600, positionedPhases.length * 120 + 160);

  const getPhaseIcon = (phase: TrailPhase) => {
    if (phase.isLocked) return <Lock className="h-6 w-6 text-muted-foreground" />;
    if (phase.status === "completed") return <CheckCircle2 className="h-6 w-6 text-white" />;
    
    switch (phase.type) {
      case "video":
        return <Play className="h-6 w-6 text-white" />;
      case "quiz":
        return <Star className="h-6 w-6 text-white" />;
      case "challenge":
        return <Trophy className="h-6 w-6 text-white" />;
      default:
        return <Play className="h-6 w-6 text-white" />;
    }
  };

  const getPhaseStyle = (phase: TrailPhase, index: number) => {
    if (phase.isLocked) {
      return {
        background: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
        border: "3px solid #e2e8f0"
      };
    }
    
    if (phase.status === "completed") {
      return {
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        boxShadow: "0 8px 20px rgba(16, 185, 129, 0.4), 0 4px 8px rgba(16, 185, 129, 0.2)",
        border: "3px solid #6ee7b7"
      };
    }
    
    if (phase.status === "inProgress") {
      return {
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        boxShadow: "0 8px 20px rgba(59, 130, 246, 0.4), 0 4px 8px rgba(59, 130, 246, 0.2)",
        border: "3px solid #93c5fd"
      };
    }
    
    return {
      background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      boxShadow: "0 6px 16px rgba(139, 92, 246, 0.3), 0 3px 6px rgba(139, 92, 246, 0.15)",
      border: "3px solid #c4b5fd"
    };
  };

  const renderConnection = (from: TrailPhase, to: TrailPhase, index: number) => {
    const isActive = from.status === "completed";
    const isNextActive = from.status === "completed" || from.status === "inProgress";
    
    // Criar path curvo entre os pontos
    const midX = (from.position.x + to.position.x) / 2;
    const midY = (from.position.y + to.position.y) / 2;
    const controlX = midX + (from.position.x > to.position.x ? -30 : 30);
    
    const pathData = `M ${from.position.x} ${from.position.y + 35} Q ${controlX} ${midY} ${to.position.x} ${to.position.y - 35}`;
    
    return (
      <g key={`connection-${index}`}>
        {/* Linha de fundo */}
        <path
          d={pathData}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Linha de progresso */}
        <path
          d={pathData}
          fill="none"
          stroke={isActive ? "#10b981" : "#cbd5e1"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={isActive ? "0" : "8,4"}
          className={`transition-all duration-500 ${isActive ? "" : "opacity-60"}`}
        />
        {/* Efeito de brilho para conexões ativas */}
        {isNextActive && (
          <path
            d={pathData}
            fill="none"
            stroke="url(#glowGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-pulse"
          />
        )}
      </g>
    );
  };

  return (
    <div className={cn("relative w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl overflow-hidden", className)}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full">
          <defs>
            <pattern id="dotPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.2"/>
            </pattern>
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6"/>
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotPattern)" />
        </svg>
      </div>

      {/* Progress header */}
      <div className="relative z-10 p-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {Math.round(moduleProgress)}% Concluído
          </span>
        </div>
      </div>

      {/* SVG container for trail */}
      <div className="relative" style={{ height: containerHeight }}>
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="2" dy="4" result="offset"/>
              <feFlood floodColor="#000000" floodOpacity="0.2"/>
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

        {/* Phase nodes */}
        {positionedPhases.map((phase, index) => (
          <div key={phase.id} className="absolute">
            <button
              onClick={() => !phase.isLocked && onPhaseClick(phase)}
              disabled={phase.isLocked}
              onMouseEnter={() => setHoveredPhase(index)}
              onMouseLeave={() => setHoveredPhase(null)}
              className={cn(
                "relative w-16 h-16 rounded-full transition-all duration-300 transform-gpu",
                "hover:scale-110 active:scale-95 disabled:cursor-not-allowed",
                "flex items-center justify-center",
                hoveredPhase === index && !phase.isLocked && "scale-110"
              )}
              style={{
                left: phase.position.x - 32,
                top: phase.position.y - 32,
                ...getPhaseStyle(phase, index),
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))"
              }}
            >
              {getPhaseIcon(phase)}
              
              {/* Phase number badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-slate-800 border-2 border-current rounded-full flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 shadow-lg">
                {index + 1}
              </div>

              {/* Pulse animation for current phase */}
              {phase.status === "inProgress" && (
                <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping"></div>
              )}

              {/* Completion sparkle */}
              {phase.status === "completed" && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Star className="h-2 w-2 text-yellow-800 fill-current" />
                </div>
              )}
            </button>

            {/* Phase tooltip */}
            {hoveredPhase === index && (
              <div
                className="absolute z-50 bg-white dark:bg-slate-800 rounded-lg p-3 shadow-xl border border-slate-200 dark:border-slate-700 min-w-[140px] transform -translate-x-1/2 animate-fade-in"
                style={{
                  left: phase.position.x,
                  top: phase.position.y - 80,
                }}
              >
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 text-center">
                  {phase.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 capitalize">
                  {phase.duration || 5} min • {phase.type}
                </p>
                {phase.isLocked && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 text-center mt-1">
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
