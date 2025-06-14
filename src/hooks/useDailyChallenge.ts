
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRewardModal } from '@/components/XpRewardModal/RewardModalContext';

interface DailyChallenge {
  id: string;
  challenge: string;
  createdAt: string;
  expiresAt: string;
  completed: boolean;
}

export const useDailyChallenge = (userId: string) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const queryClient = useQueryClient();
  const { showRewardModal } = useRewardModal();

  // Buscar desafio atual
  const { data: currentChallenge, isLoading } = useQuery({
    queryKey: ['dailyChallenge', userId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Verificar se já existe um desafio para hoje
      const { data: existingChallenge } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('created_date', today)
        .maybeSingle();

      if (existingChallenge) {
        return existingChallenge;
      }

      // Se não existe, criar um novo
      return await generateNewChallenge(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Calcular tempo restante
  useEffect(() => {
    if (!currentChallenge) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expires = new Date(currentChallenge.expires_at).getTime();
      const remaining = Math.max(0, expires - now);
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [currentChallenge]);

  const generateNewChallenge = async (userId: string) => {
    try {
      // Buscar fases completadas pelo usuário
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

      // Chamar edge function para gerar desafio
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
      console.error('Erro ao gerar desafio:', error);
      return null;
    }
  };

  const completeChallenge = async () => {
    if (!currentChallenge || currentChallenge.completed) return;

    try {
      // Marcar desafio como concluído
      const { error: updateError } = await supabase
        .from('daily_challenges')
        .update({ completed: true })
        .eq('id', currentChallenge.id);

      if (updateError) throw updateError;

      // Adicionar XP
      const { error: xpError } = await supabase
        .from('xp_history')
        .insert({
          user_id: userId,
          xp_amount: 15,
          source: 'DAILY_CHALLENGE',
          source_id: currentChallenge.id
        });

      if (xpError) throw xpError;

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
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return {
    currentChallenge,
    isLoading,
    timeRemaining: formatTimeRemaining(timeRemaining),
    completeChallenge,
    canComplete: currentChallenge && !currentChallenge.completed && timeRemaining > 0
  };
};
