
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

  // Centralizar as fases verticalmente
  const generatePhasePositions = (): TrailPhase[] => {
    return phases.map((phase, index) => {
      const yStep = 200; // Espaçamento entre cards
      const centerX = 50; // Centro horizontal
      
      // Pequena variação horizontal para criar movimento sutil
      const xVariation = index % 2 === 0 ? 48 : 52;
      
      return {
        ...phase,
        position: { x: xVariation, y: 100 + (index * yStep) }
      };
    });
  };

  const positionedPhases = generatePhasePositions();
  const containerHeight = Math.max(600, positionedPhases.length * 200 + 200);

  const getPhaseIcon = (phase: TrailPhase) => {
    if (phase.isLocked) return <Lock className="h-8 w-8 text-gray-400" />;
    if (phase.status === "completed") return <CheckCircle2 className="h-8 w-8 text-white" />;
    
    switch (phase.type) {
      case "video":
        return <Video className="h-8 w-8 text-white" />;
      case "quiz":
        return <Star className="h-8 w-8 text-white" />;
      case "challenge":
        return <Trophy className="h-8 w-8 text-white" />;
      case "text":
        return <BookText className="h-8 w-8 text-white" />;
      default:
        return <BookText className="h-8 w-8 text-white" />;
    }
  };

  const getPhaseColors = (phase: TrailPhase) => {
    if (phase.isLocked) {
      return {
        bg: "bg-gray-200",
        border: "border-gray-300",
        text: "text-gray-500"
      };
    }
    
    if (phase.status === "completed") {
      return {
        bg: "bg-green-500",
        border: "border-green-600", 
        text: "text-white"
      };
    }
    
    if (phase.status === "inProgress") {
      return {
        bg: "bg-orange-500",
        border: "border-orange-600",
        text: "text-white"
      };
    }
    
    return {
      bg: "bg-orange-400",
      border: "border-orange-500",
      text: "text-white"
    };
  };

  const renderConnection = (from: TrailPhase, to: TrailPhase, index: number) => {
    const isActive = from.status === "completed";
    
    return (
      <div
        key={`connection-${index}`}
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{
          top: from.position.y + 100,
          height: to.position.y - from.position.y - 100,
          width: "4px"
        }}
      >
        <div className={cn(
          "w-full h-full transition-all duration-1000",
          isActive ? "bg-green-500" : "bg-gray-300"
        )}>
          {isActive && (
            <div className="w-full h-4 bg-green-400 animate-pulse opacity-75" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200", className)}>
      {/* Header com progresso */}
      <div className="relative z-10 p-6 text-center">
        <div className="inline-flex items-center gap-4 bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-orange-200">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-full">
            <Award className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-orange-800">
            {Math.round(moduleProgress)}% Concluído
          </span>
        </div>
      </div>

      {/* Container da trilha */}
      <div className="relative px-4" style={{ height: containerHeight }}>
        {/* Renderizar conexões */}
        {positionedPhases.slice(0, -1).map((phase, index) => {
          const nextPhase = positionedPhases[index + 1];
          return renderConnection(phase, nextPhase, index);
        })}

        {/* Renderizar cards das fases */}
        {positionedPhases.map((phase, index) => {
          const colors = getPhaseColors(phase);
          
          return (
            <div
              key={phase.id}
              className="absolute left-1/2 transform -translate-x-1/2"
              style={{
                top: phase.position.y,
                width: "320px"
              }}
            >
              <div
                className={cn(
                  "relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 overflow-hidden",
                  colors.border,
                  !phase.isLocked && "hover:scale-105 hover:shadow-2xl cursor-pointer",
                  phase.isLocked && "opacity-60 cursor-not-allowed"
                )}
                onClick={() => !phase.isLocked && onPhaseClick(phase)}
                onMouseEnter={() => setHoveredPhase(index)}
                onMouseLeave={() => setHoveredPhase(null)}
              >
                {/* Status indicator no topo direito */}
                <div className="absolute top-4 right-4 z-10">
                  {phase.status === "completed" && (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                  {phase.status === "inProgress" && (
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Ícone principal */}
                <div className="flex justify-center pt-8 pb-4">
                  <div className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300",
                    colors.bg,
                    hoveredPhase === index && !phase.isLocked && "scale-110"
                  )}>
                    {getPhaseIcon(phase)}
                  </div>
                </div>

                {/* Conteúdo do card */}
                <div className="px-6 pb-6 text-center">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    {phase.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {phase.description || "Conceitos básicos e princípios fundamentais"}
                  </p>
                  
                  {/* Informações adicionais */}
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

                  {/* Botão de ação */}
                  {!phase.isLocked && (
                    <button
                      className={cn(
                        "w-full py-3 rounded-xl font-semibold transition-all duration-300",
                        phase.status === "completed" 
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-orange-500 hover:bg-orange-600 text-white"
                      )}
                    >
                      {phase.status === "completed" 
                        ? "Revisar Conteúdo" 
                        : phase.status === "inProgress"
                          ? "Continuar"
                          : "Iniciar"
                      }
                    </button>
                  )}
                  
                  {phase.isLocked && (
                    <div className="w-full py-3 bg-gray-200 rounded-xl text-gray-500 font-medium">
                      Complete a fase anterior
                    </div>
                  )}
                </div>

                {/* Efeito de brilho para fases ativas */}
                {(phase.status === "inProgress" || phase.status === "completed") && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse opacity-50" />
                )}
              </div>

              {/* Número da fase */}
              <div className="absolute -left-4 top-8 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
