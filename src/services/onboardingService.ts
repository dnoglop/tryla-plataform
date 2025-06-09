// src/services/onboardingService.ts

import { supabase } from "@/integrations/supabase/client";

/**
 * Verifica na tabela `user_onboarding` se o usuário completou o processo.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<boolean>} - Retorna `true` se um registro existir, senão `false`.
 */
export const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
  if (!userId) {
    return false;
  }

  try {
    const { count, error } = await supabase
      .from('user_onboarding')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao verificar status do onboarding:', error);
      return false;
    }

    return (count ?? 0) > 0;
  } catch (err) {
    console.error('Exceção ao verificar onboarding:', err);
    return false;
  }
};

/**
 * Marca o onboarding de um usuário como completo inserindo um registro na tabela `user_onboarding`.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<boolean>} - Retorna `true` em caso de sucesso, senão `false`.
 */
export const completeOnboarding = async (userId: string): Promise<boolean> => {
  if (!userId) {
    return false;
  }

  try {
    // 'upsert' previne erros caso a função seja chamada mais de uma vez para o mesmo usuário.
    const { error } = await supabase
      .from('user_onboarding')
      .upsert({ user_id: userId }, { onConflict: 'user_id' });

    if (error) {
      console.error('Erro ao marcar onboarding como completo:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exceção ao completar onboarding:', err);
    return false;
  }
};