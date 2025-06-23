import React from 'react';
import { Clock, Target, CheckCircle, Zap, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DailyChallengeCardProps {
  challenge?: {
    id: string;
    challenge_text: string;
    challenge_title: string;
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
  // Nome personalizado baseado no desafio criado pela IA
  const getChallengeTitle = () => {
    return challenge?.challenge_title || "🎯 Desafio Especial";
  };

  // Função para escolher ícone baseado no contexto
  const getChallengeIcon = () => {
    if (challenge?.completed) return CheckCircle;

    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return Target;
    if (hour >= 12 && hour < 18) return Zap;
    if (hour >= 18 && hour < 22) return Trophy;
    return Star;
  };

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
      <div className="bg-card rounded-2xl p-6 shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-muted rounded-lg">
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-card-foreground">🎯 Seu Próximo Desafio</h3>
            <p className="text-sm text-muted-foreground">
              Complete algumas fases para desbloquear desafios personalizados!
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
    );
  }

  const isCompleted = challenge.completed;
  const ChallengeIcon = getChallengeIcon();

  return (
    <div className={cn(
      "rounded-2xl p-6 shadow-sm border transition-all duration-300",
      isCompleted 
        ? "bg-emerald-500/10 border-emerald-500/20" 
        : "bg-gradient-to-br from-card to-card/80 border-primary/20"
    )}>
      {/* Header com ícone e título dinâmico */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "p-2 rounded-lg transition-all duration-300",
          isCompleted ? "bg-emerald-500/20" : "bg-gradient-to-br from-primary/20 to-primary/30"
        )}>
          <ChallengeIcon className={cn(
            "h-5 w-5 transition-colors duration-300",
            isCompleted ? "text-emerald-500" : "text-primary"
          )} />
        </div>
        <div>
          <h2 className="font-bold text-card-foreground text-lg">
            {getChallengeTitle()}
          </h2>
          <h5 className="text-sm text-muted-foreground">
            Baseado em: {challenge.related_phase}
          </h5>
        </div>
      </div>

      {/* Timer com estilo melhorado */}
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
          Próximo em: {timeRemaining}
        </span>
      </div>

      {/* Separador */}
      <div className="border-t border-border mb-4"></div>

      {/* Conteúdo do desafio */}
      <div className="bg-background/50 rounded-lg p-4 mb-4 border-l-4 border-l-primary/50">
        <p className="text-sm text-card-foreground leading-relaxed">
          {challenge.challenge_text}
        </p>
      </div>

      {/* Botão de ação */}
      <Button
        onClick={onComplete}
        disabled={!canComplete || isCompleted}
        className={cn(
          "w-full transition-all duration-200 font-semibold",
          isCompleted
            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
            : "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl"
        )}
      >
        {isCompleted ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Concluído! +15 XP ✨
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Desafio concluído!
          </>
        )}
      </Button>
    </div>
  );
};

export default DailyChallengeCard;