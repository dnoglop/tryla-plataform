// ARQUIVO: components/phase-detail/PhaseNavigation.tsx - VERSÃO CORRIGIDA

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { Phase } from '@/services/moduleService';

interface PhaseNavigationProps {
  previousPhase: Phase | null;
  nextPhase: Phase | null;
  phase: Phase;
  isSubmitting: boolean;
  quizCompleted: boolean; // MUDANÇA: usar quizCompleted em vez de isPhaseCompleted
  onNavigateToPrevious: () => void;
  onCompletePhase: () => void;
  onNavigateToNext: () => void;
}

export const PhaseNavigation: React.FC<PhaseNavigationProps> = ({
  previousPhase,
  nextPhase,
  phase,
  isSubmitting,
  quizCompleted, // MUDANÇA: receber quizCompleted
  onNavigateToPrevious,
  onCompletePhase,
  onNavigateToNext,
}) => {
  // CORREÇÃO: Determinar se o botão deve estar habilitado
  const canCompletePhase = () => {
    if (phase.type === 'quiz') {
      // Para quiz, só pode completar se o quiz foi finalizado
      return quizCompleted;
    }
    // Para outros tipos de fase, sempre pode completar
    return true;
  };

  return (
    <div className="mt-8 flex justify-between items-center">
      {/* Botão de Voltar */}
      <Button
        variant="outline"
        onClick={onNavigateToPrevious}
        disabled={!previousPhase || isSubmitting}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Anterior
      </Button>

      {/* Botão de Finalizar Fase */}
      <Button
        onClick={onCompletePhase}
        disabled={isSubmitting || !canCompletePhase()} // CORREÇÃO: usar a função canCompletePhase
        size="lg"
      >
        {isSubmitting ? 'Finalizando...' : 
         nextPhase ? 'Finalizar Fase' : 'Finalizar Módulo'
        }
        <Check className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};