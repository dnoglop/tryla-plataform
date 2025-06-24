// ARQUIVO: src/components/journey/RealmPortalCard.tsx

import React from "react";
import { motion } from "framer-motion";
import { Award, Lock } from "lucide-react";
import { InteractiveCard } from "./InteractiveCard"; // Importando o card base
import { Module } from "@/services/moduleService"; // Importando o tipo Module

// Definindo as propriedades que o Portal do Reino irá receber
interface RealmPortalCardProps {
  module: Module;
  progress: number;
  completed: boolean;
  locked: boolean;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

// Componente específico para o Portal do Reino
export const RealmPortalCard = ({
  module,
  progress,
  completed,
  locked,
  onClick,
}: RealmPortalCardProps) => (
  <InteractiveCard isLocked={locked} onClick={onClick}>
    <>
      {/* Conteúdo Superior do Card */}
      <div>
        <div className="flex justify-between items-start">
          {/* O emoji do Reino, com efeito de profundidade */}
          <span className="text-4xl" style={{ transform: "translateZ(20px)" }}>
            {module.emoji || "🚀"}
          </span>
          {/* Ícone de Selo Mágico (se estiver bloqueado) */}
          {locked && <Lock className="w-5 h-5 text-muted-foreground" />}
          {/* Ícone de Brasão de Conquista (se estiver completo) */}
          {completed && <Award className="w-6 h-6 text-yellow-500" />}
        </div>
        <h3 className="text-lg font-bold text-card-foreground mt-3">
          {module.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {module.description}
        </p>
      </div>

      {/* Conteúdo Inferior do Card */}
      <div className="mt-4">
        {/* Barra de Essência (Progresso) */}
        <div className="essencia-bar">
          <motion.div
            className="essencia-valor"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {Math.round(progress)}% explorado
        </p>
      </div>
    </>
  </InteractiveCard>
);
