// ARQUIVO: src/components/journey/MilestoneCard.tsx (VERSÃO FINAL COMPLETA COM VARIANTES)

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lock, CheckCircle2, Video, Star, Trophy, BookText } from "lucide-react";
import { Phase } from "@/services/moduleService";

// Tipos
export type MilestoneVariant = 'completed' | 'active' | 'locked' | 'default';

interface MilestoneCardProps {
  phase: Phase & { isLocked: boolean; status?: PhaseStatus };
  isActive: boolean;
  index: number;
  variant: MilestoneVariant;
  onClick: (phase: Phase, event: React.MouseEvent<HTMLDivElement>) => void;
}

// Mapeamento de estilos para cada variante de card
const variantStyles = {
  completed: {
    border: "border-green-500/30",
    glow: "bg-green-500/10",
    iconContainer: "bg-green-500 text-white",
  },
  active: {
    border: "border-primary/50",
    glow: "milestone-active-glow", // Borda animada
    iconContainer: "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
  },
  locked: {
    border: "border-transparent",
    glow: "bg-muted/30",
    iconContainer: "bg-muted/50 text-muted-foreground/70",
  },
  default: {
    border: "border-transparent",
    glow: "",
    iconContainer: "bg-muted text-muted-foreground",
  }
};

// Ícones para cada tipo de fase
const phaseIcons = {
  video: <Video className="h-6 w-6" />,
  quiz: <Star className="h-6 w-6" />,
  challenge: <Trophy className="h-6 w-6" />,
  text: <BookText className="h-6 w-6" />,
};

export const MilestoneCard = ({ phase, isActive, index, variant, onClick }: MilestoneCardProps) => {
  const styles = variantStyles[variant];

  const getPhaseIcon = () => {
    if (variant === 'locked') return <Lock className="h-6 w-6" />;
    return phaseIcons[phase.type] || <BookText className="h-6 w-6" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
      className="w-full"
    >
      <div
        onClick={(e) => !phase.isLocked && onClick(phase, e)}
        className={cn(
          "relative rounded-3xl p-1 transition-all duration-300 select-none group",
          phase.isLocked ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-[22px] z-0 transition-all duration-500 border",
            styles.glow,
            styles.border
          )}
        />

        <motion.div
            animate={isActive ? { scale: [1, 1.01, 1] } : {}}
            transition={isActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
            className={cn(
            "relative z-10 flex items-center gap-4 p-4 rounded-2xl shadow-lg",
            "bg-card",
            phase.isLocked && "opacity-70",
            !phase.isLocked && "group-hover:scale-[1.02] group-hover:-translate-y-1 transition-transform"
          )}
        >
          {/* Ícone da Missão */}
          <div className={cn(
              "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300",
              styles.iconContainer,
              !phase.isLocked && "group-hover:bg-primary/80 group-hover:text-white"
          )}>
            {getPhaseIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase font-semibold">
              {variant === 'completed' ? 'Concluído' : `Missão ${index + 1}`}
            </p>
            <h3 className="font-bold text-card-foreground truncate">{phase.name}</h3> 
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>{phase.duration || 5} min</span>
                <span className="font-bold">·</span>
                <span className="capitalize">{phase.type}</span>
            </div>
          </div>

          {variant === 'completed' && (
              <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};