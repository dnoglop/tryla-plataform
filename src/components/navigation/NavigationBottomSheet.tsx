
import React from 'react';
import { CheckCircle2, Lock, Play, ArrowRight } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Phase {
  id: number;
  name: string;
  type: string;
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent: boolean;
}

interface NavigationBottomSheetProps {
  children: React.ReactNode;
  module: {
    id: number;
    name: string;
    progress: number;
  };
  phases: Phase[];
  onPhaseClick: (phaseId: number) => void;
  onContinue: () => void;
}

export const NavigationBottomSheet: React.FC<NavigationBottomSheetProps> = ({
  children,
  module,
  phases,
  onPhaseClick,
  onContinue
}) => {
  const completedPhases = phases.filter(p => p.isCompleted).length;
  const nextPhase = phases.find(p => !p.isCompleted && !p.isLocked);

  const getPhaseIcon = (phase: Phase) => {
    if (phase.isLocked) return <Lock className="h-4 w-4 text-muted-foreground" />;
    if (phase.isCompleted) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return <Play className="h-4 w-4 text-primary" />;
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-bold">{module.name}</h3>
              <div className="text-sm text-muted-foreground">
                {completedPhases} de {phases.length} fases concluídas
              </div>
              <Progress value={module.progress} className="h-2" />
            </div>
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-6 space-y-4">
          {/* Botão de continuar */}
          {nextPhase && (
            <Button
              onClick={onContinue}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl"
            >
              <Play className="mr-2 h-5 w-5" />
              Continuar: {nextPhase.name}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {/* Lista de fases */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <h4 className="font-semibold text-sm text-muted-foreground px-2">
              Todas as Fases
            </h4>
            {phases.map((phase, index) => (
              <button
                key={phase.id}
                onClick={() => !phase.isLocked && onPhaseClick(phase.id)}
                disabled={phase.isLocked}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                  phase.isCurrent
                    ? "bg-primary/10 border border-primary/20"
                    : phase.isLocked
                      ? "bg-muted/50 opacity-60 cursor-not-allowed"
                      : "bg-card hover:bg-muted/50 border border-border",
                  "group"
                )}
              >
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted/50">
                  <span className="text-xs font-medium">
                    {index + 1}
                  </span>
                </div>
                
                <div className="flex-1 text-left">
                  <p className={cn(
                    "font-medium text-sm",
                    phase.isCurrent ? "text-primary" : "text-foreground"
                  )}>
                    {phase.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {phase.type}
                  </p>
                </div>
                
                <div className="flex-shrink-0">
                  {getPhaseIcon(phase)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
