
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Lock, Play, Star, Trophy } from 'lucide-react';
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
  const [connections, setConnections] = useState<Array<{from: number, to: number}>>([]);

  // Gerar posições das fases em formato de trilha
  const generatePhasePositions = (): TrailPhase[] => {
    return phases.map((phase, index) => {
      // Criar um layout em espiral/trilha
      const angle = (index * 60) % 360; // 60 graus entre cada fase
      const radius = 80 + (Math.floor(index / 6) * 40); // Aumentar raio a cada volta
      const centerX = 200;
      const centerY = 300;
      
      const x = centerX + Math.cos((angle * Math.PI) / 180) * radius;
      const y = centerY + Math.sin((angle * Math.PI) / 180) * radius;

      return {
        ...phase,
        position: { x: Math.max(50, Math.min(350, x)), y: Math.max(50, Math.min(550, y)) }
      };
    });
  };

  // Gerar conexões entre fases
  useEffect(() => {
    const newConnections = [];
    for (let i = 0; i < phases.length - 1; i++) {
      newConnections.push({ from: i, to: i + 1 });
    }
    setConnections(newConnections);
  }, [phases.length]);

  const positionedPhases = generatePhasePositions();

  const getPhaseIcon = (phase: TrailPhase) => {
    if (phase.isLocked) return <Lock className="h-5 w-5 text-muted-foreground" />;
    if (phase.status === "completed") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    
    switch (phase.type) {
      case "video":
        return <Play className="h-5 w-5 text-primary" />;
      case "quiz":
        return <Star className="h-5 w-5 text-primary" />;
      case "challenge":
        return <Trophy className="h-5 w-5 text-primary" />;
      default:
        return <Play className="h-5 w-5 text-primary" />;
    }
  };

  const getPhaseColor = (phase: TrailPhase) => {
    if (phase.isLocked) return "bg-muted border-muted-foreground/30";
    if (phase.status === "completed") return "bg-green-500/20 border-green-500 shadow-green-500/20";
    if (phase.status === "inProgress") return "bg-primary/20 border-primary shadow-primary/20";
    return "bg-background border-border hover:border-primary/50";
  };

  const renderConnection = (from: TrailPhase, to: TrailPhase, index: number) => {
    const isActive = from.status === "completed";
    const strokeWidth = isActive ? 3 : 2;
    const strokeColor = isActive ? "#10b981" : "#e5e7eb";

    return (
      <line
        key={`connection-${index}`}
        x1={from.position.x}
        y1={from.position.y}
        x2={to.position.x}
        y2={to.position.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={isActive ? "0" : "5,5"}
        className="transition-all duration-500"
      />
    );
  };

  return (
    <div className={cn("relative w-full h-[600px] bg-gradient-to-br from-background to-muted/20 rounded-2xl overflow-hidden", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent)]" />
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* SVG for connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {connections.map((connection, index) => {
          const fromPhase = positionedPhases[connection.from];
          const toPhase = positionedPhases[connection.to];
          return renderConnection(fromPhase, toPhase, index);
        })}
      </svg>

      {/* Progress indicator */}
      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-sm font-medium">{Math.round(moduleProgress)}% Concluído</span>
        </div>
      </div>

      {/* Phase nodes */}
      {positionedPhases.map((phase, index) => (
        <button
          key={phase.id}
          onClick={() => !phase.isLocked && onPhaseClick(phase)}
          disabled={phase.isLocked}
          className={cn(
            "absolute w-16 h-16 rounded-full border-2 transition-all duration-300",
            "flex items-center justify-center transform-gpu",
            "hover:scale-110 active:scale-95",
            "shadow-lg hover:shadow-xl",
            getPhaseColor(phase),
            phase.isLocked && "cursor-not-allowed opacity-60"
          )}
          style={{
            left: phase.position.x - 32,
            top: phase.position.y - 32,
          }}
        >
          {getPhaseIcon(phase)}
          
          {/* Phase number */}
          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-background border-2 border-current rounded-full flex items-center justify-center text-xs font-bold">
            {index + 1}
          </div>

          {/* Pulse animation for current phase */}
          {phase.status === "inProgress" && (
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
          )}
        </button>
      ))}

      {/* Phase details on hover */}
      {positionedPhases.map((phase, index) => (
        <div
          key={`tooltip-${phase.id}`}
          className="absolute pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200 bg-background/90 backdrop-blur-sm rounded-lg p-2 text-xs border shadow-lg z-10"
          style={{
            left: phase.position.x - 40,
            top: phase.position.y - 80,
            width: '80px'
          }}
        >
          <p className="font-medium text-center truncate">{phase.name}</p>
          <p className="text-muted-foreground text-center capitalize">{phase.type}</p>
        </div>
      ))}
    </div>
  );
};
