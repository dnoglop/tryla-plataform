
import React from 'react';
import { Clock, Target, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DailyChallengeCardProps {
  challenge?: {
    id: string;
    challenge_text: string;
    completed: boolean;
    related_phase: string;
  };
  timeRemaining: string;
  onComplete: () => void;
  canComplete: boolean;
  isLoading: boolean;
}

const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({
  challenge,
  timeRemaining,
  onComplete,
  canComplete,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-sm border animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-muted rounded-lg">
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="h-5 w-32 bg-muted rounded"></div>
            <div className="h-4 w-24 bg-muted rounded mt-1"></div>
          </div>
        </div>
        <div className="h-16 bg-muted rounded mb-4"></div>
        <div className="h-10 bg-muted rounded"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-sm border text-center">
        <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-bold text-card-foreground mb-2">Desafio do Dia</h3>
        <p className="text-muted-foreground text-sm">
          Complete algumas fases para receber seu primeiro desafio!
        </p>
        <div className="flex items-center justify-center gap-2 text-muted-foreground mt-4">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-mono">
            Próximo em: {timeRemaining}
          </span>
        </div>
      </div>
    );
  }

  const isCompleted = challenge.completed;

  return (
    <div className={cn(
      "rounded-2xl p-6 shadow-sm border transition-all duration-300",
      isCompleted 
        ? "bg-emerald-500/10 border-emerald-500/20" 
        : "bg-card"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            isCompleted ? "bg-emerald-500/20" : "bg-primary/20"
          )}>
            {isCompleted ? (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              <Target className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-card-foreground">Desafio do Dia</h3>
            <p className="text-xs text-muted-foreground">
              Baseado em: {challenge.related_phase}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-mono">
            Próximo em: {timeRemaining}
          </span>
        </div>
      </div>

      <div className="bg-background/50 rounded-lg p-4 mb-4">
        <p className="text-sm text-card-foreground leading-relaxed">
          {challenge.challenge_text}
        </p>
      </div>

      <Button
        onClick={onComplete}
        disabled={!canComplete || isCompleted}
        className={cn(
          "w-full transition-all duration-200",
          isCompleted
            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
            : "bg-primary hover:bg-primary/90 text-primary-foreground"
        )}
      >
        {isCompleted ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Concluído (+15 XP)
          </>
        ) : (
          "Marcar como Concluído (+15 XP)"
        )}
      </Button>
    </div>
  );
};

export default DailyChallengeCard;
