
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRewardModal } from '@/components/XpRewardModal/RewardModalContext';

interface DailyChallenge {
  id: string;
  challenge_text: string;
  created_date: string;
  expires_at: string;
  completed: boolean;
  related_phase: string;
}

export const useDailyChallenge = (userId: string) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const queryClient = useQueryClient();
  const { showRewardModal } = useRewardModal();

  // Buscar desafio atual
  const { data: currentChallenge, isLoading } = useQuery({
    queryKey: ['dailyChallenge', userId],
    queryFn: async () => {
      try {
        // Primeiro verificar se existe um desafio válido hoje
        const today = new Date().toISOString().split('T')[0];
        
        const { data: existingChallenge } = await supabase
          .from('daily_challenges')
          .select('*')
          .eq('user_id', userId)
          .eq('created_date', today)
          .single();

        if (existingChallenge) {
          return existingChallenge;
        }

        // Se não existe, tentar buscar fases completadas
        const { data: completedPhases } = await supabase
          .from('user_phases')
          .select(`
            phase_id,
            phases!inner(
              id,
              name,
              description,
              module_id,
              modules!inner(name)
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'completed');

        if (!completedPhases || completedPhases.length === 0) {
          return null;
        }

        // Gerar novo desafio via edge function
        const { data: challengeData, error } = await supabase.functions.invoke('generate-daily-challenge', {
          body: { 
            userId,
            completedPhases: completedPhases.map(cp => ({
              name: cp.phases.name,
              description: cp.phases.description,
              moduleName: cp.phases.modules.name
            }))
          }
        });

        if (error) throw error;
        return challengeData;

      } catch (error) {
        console.error('Erro ao buscar/gerar desafio:', error);
        return null;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Calcular tempo restante para o próximo desafio
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const remaining = Math.max(0, tomorrow.getTime() - now.getTime());
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  const completeChallenge = async () => {
    if (!currentChallenge || currentChallenge.completed) return;

    try {
      // Chamar edge function para completar desafio
      const { error: completeError } = await supabase.functions.invoke('complete-daily-challenge', {
        body: { 
          challengeId: currentChallenge.id,
          userId 
        }
      });

      if (completeError) throw completeError;

      // Mostrar modal de recompensa
      await showRewardModal({
        xpAmount: 15,
        title: 'Desafio Concluído!'
      });

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['dailyChallenge', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });

    } catch (error) {
      console.error('Erro ao completar desafio:', error);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    currentChallenge,
    isLoading,
    timeRemaining: formatTimeRemaining(timeRemaining),
    completeChallenge,
    canComplete: currentChallenge && !currentChallenge.completed && timeRemaining > 0
  };
};
