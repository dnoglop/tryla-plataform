// ARQUIVO: src/components/journey/MilestoneCard.tsx (VERSÃO RESPONSIVA)

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lock, CheckCircle2, Video, Star, Trophy, BookText } from "lucide-react";
import { Phase } from "@/services/moduleService";

const phaseIcons = {
  video: <Video className="h-5 w-5 sm:h-6 sm:w-6" />,
  quiz: <Star className="h-5 w-5 sm:h-6 sm:w-6" />,
  challenge: <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />,
  text: <BookText className="h-5 w-5 sm:h-6 sm:w-6" />,
};

interface MilestoneCardProps {
  phase: Phase & { isLocked: boolean };
  isActive: boolean;
  index: number;
  onClick: (phase: Phase, event: React.MouseEvent<HTMLDivElement>) => void;
}

export const MilestoneCard = ({ phase, isActive, index, onClick }: MilestoneCardProps) => {
  const getPhaseIcon = () => {
    if (phase.isLocked) return <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/70" />;
    return phaseIcons[phase.type] || <BookText className="h-5 w-5 sm:h-6 sm:w-6" />;
  };

  return (
    // REMOVIDO: Largura fixa w-[280px] sm:w-[320px]. Agora é w-full para se adaptar ao pai.
    <motion.div
      className="absolute z-10 w-full" 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
    >
      <div
        onClick={(e) => !phase.isLocked && onClick(phase, e)}
        className={cn(
          "relative rounded-3xl p-1 sm:p-1.5 transition-all duration-300 select-none group",
          phase.isLocked ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-[22px] z-0 transition-all duration-500",
            isActive && "milestone-active-glow",
            phase.status === 'completed' && "bg-green-500/20",
            phase.isLocked && "bg-muted/30"
          )}
        />

        <motion.div
            animate={isActive ? { scale: [1, 1.02, 1] } : {}}
            transition={isActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
            className={cn(
            "relative z-10 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl shadow-lg", // Padding e gap responsivos
            "bg-card border",
            isActive ? "border-primary/50" : "border-transparent",
            phase.isLocked && "opacity-60",
            !phase.isLocked && "group-hover:scale-[1.03] group-hover:-translate-y-1 transition-transform"
          )}
        >
          {/* Ícone com tamanho responsivo */}
          <div className={cn(
              "flex-shrink-0 w-12 h-12 sm:w-14 sm:w-14 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300",
              isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground",
              phase.status === 'completed' && "bg-green-500 text-white",
              phase.isLocked && "bg-muted/50",
              !phase.isLocked && "group-hover:bg-primary/80 group-hover:text-white"
          )}>
            {getPhaseIcon()}
          </div>

          <div className="flex-1 min-w-0"> {/* Adicionado min-w-0 para forçar a quebra de linha do texto */}
            <p className="text-xs text-muted-foreground uppercase font-semibold">
              {phase.status === 'completed' ? 'Concluído' : `Missão ${index + 1}`}
            </p>
            {/* O título agora pode quebrar em múltiplas linhas sem cortar */}
            <h3 className="font-bold text-card-foreground truncate">{phase.name}</h3> 
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>{phase.duration || 5} min</span>
                <span className="font-bold">·</span>
                <span className="capitalize">{phase.type}</span>
            </div>
          </div>

          {phase.status === 'completed' && (
              <div className="absolute top-2 right-2 p-1 bg-card rounded-full">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:h-5 text-green-500" />
              </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};