
import { supabase } from "@/integrations/supabase/client";

export const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_onboarding')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar status do onboarding:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Erro inesperado ao verificar onboarding:', error);
    return false;
  }
};

export const completeOnboarding = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_onboarding')
      .insert({ user_id: userId });

    if (error) {
      console.error('Erro ao marcar onboarding como completo:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro inesperado ao completar onboarding:', error);
    return false;
  }
};
