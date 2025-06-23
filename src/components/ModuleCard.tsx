// ARQUIVO: src/components/ModuleCard.tsx (VERSÃO REATORADA)

import { Link } from "react-router-dom";
import { Award, ArrowRightCircle, Lock } from 'lucide-react';

interface ModuleCardProps {
  id: number;
  name: string;
  description: string;
  emoji?: string;
  progress: number;
  locked?: boolean;
  completed?: boolean;
}

const ModuleCard = ({ 
  id, 
  name, 
  description, 
  emoji,
  progress, 
  locked = false,
  completed = false
}: ModuleCardProps) => {

  // --- MUDANÇA: Lógica para determinar o ícone de status/ação ---
  const StatusIcon = () => {
    if (completed) {
      return <Award className="h-7 w-7 text-amber-500" aria-label="Missão Concluída"/>;
    }
    if (locked) {
      return <Lock className="h-6 w-6 text-muted-foreground" aria-label="Missão Bloqueada" />;
    }
    return <ArrowRightCircle className="h-7 w-7 text-primary opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" aria-label="Iniciar Missão" />;
  };

  const CardContent = () => (
    // --- MUDANÇA: Estrutura e estilo do card ---
    // Adicionamos transições, `group`, e classes de hover para efeito de "levantar"
    // O layout agora é flexível e usa `dark:` variants para cores.
    <div className={`
      group h-full flex flex-col justify-between bg-card p-5 rounded-2xl 
      shadow-md border border-transparent 
      transition-all duration-300 ease-in-out
      ${!locked 
        ? 'hover:shadow-xl hover:scale-[1.02] hover:border-primary/30 cursor-pointer' 
        : 'opacity-70 cursor-not-allowed bg-muted/50'
      }
    `}>
      {/* SEÇÃO SUPERIOR: Ícone, Título e Ícone de Ação */}
      <div className="flex items-start gap-4">
        {/* Ícone do Módulo (similar ao SecondaryTool da LabPage) */}
        <div className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center bg-background border text-3xl">
          {locked ? <Lock className="h-7 w-7 text-muted-foreground" /> : emoji || "🗺️"}
        </div>

        {/* Título e Descrição */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-card-foreground text-lg leading-tight line-clamp-2">{name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
        </div>

        {/* Ícone de Ação/Status */}
        <div className="flex-shrink-0">
          <StatusIcon />
        </div>
      </div>

      {/* SEÇÃO INFERIOR: Barra de Progresso */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground font-medium">
            {completed ? 'Concluído' : 'Progresso'}
          </span>
          <span className={`font-semibold ${completed ? 'text-amber-500' : 'text-card-foreground'}`}>
            {Math.round(progress)}%
          </span>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ease-out ${completed ? 'bg-amber-400' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );

  // Renderiza um Link apenas se o card não estiver bloqueado
  if (locked) {
    return <CardContent />;
  }

  return (
    <Link to={`/modulo/${id}`} className="h-full">
      <CardContent />
    </Link>
  );
};

export default ModuleCard;