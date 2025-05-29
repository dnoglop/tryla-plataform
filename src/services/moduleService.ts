
import { supabase } from "@/integrations/supabase/client";

export type PhaseStatus = "notStarted" | "inProgress" | "completed";
export type ModuleType = "autoconhecimento" | "empatia" | "growth" | "comunicacao" | "futuro";
export type PhaseType = "text" | "video" | "quiz" | "challenge";
export type IconType = "video" | "text" | "challenge" | "quiz" | "game";

export interface Module {
  id: number;
  created_at: string;
  name: string;
  description: string | null;
  type: ModuleType;
  emoji: string;
  order_index: number | null;
  content: string | null;
}

export interface Phase {
  id: number;
  created_at: string;
  module_id: number | null;
  name: string;
  description: string | null;
  type: PhaseType;
  icon_type: IconType;
  content: string | null;
  video_url: string | null;
  video_notes: string | null;
  duration: number | null;
  order_index: number | null;
  images?: string[] | null;
  status?: PhaseStatus;
}

export interface Question {
  id: number;
  created_at: string;
  quiz_id: number | null;
  phase_id?: number | null;
  question: string;
  options: string[];
  correct_answer: number;
  order_index: number | null;
}

export const getModules = async (): Promise<Module[]> => {
  try {
    let { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    return modules as Module[] || [];
  } catch (error) {
    console.error("Error fetching modules:", error);
    throw error;
  }
};

export const getModuleById = async (id: number): Promise<Module | null> => {
  try {
    let { data: module, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return module as Module;
  } catch (error) {
    console.error("Error fetching module:", error);
    throw error;
  }
};

export const createModule = async (module: Omit<Module, 'id' | 'created_at'>): Promise<Module> => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .insert([module])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Module;
  } catch (error) {
    console.error("Error creating module:", error);
    throw error;
  }
};

export const updateModule = async (id: number, module: Partial<Module>): Promise<Module> => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .update(module)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Module;
  } catch (error) {
    console.error("Error updating module:", error);
    throw error;
  }
};

export const deleteModule = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error deleting module:", error);
    throw error;
  }
};

export const getPhasesByModuleId = async (moduleId: number): Promise<Phase[]> => {
  try {
    let { data: phases, error } = await supabase
      .from('phases')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    const processedPhases = (phases || []).map(phase => ({
      ...phase,
    })) as Phase[];

    return processedPhases;
  } catch (error) {
    console.error("Error fetching phases:", error);
    throw error;
  }
};

export const getPhaseById = async (id: number): Promise<Phase | null> => {
  try {
    let { data: phase, error } = await supabase
      .from('phases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return phase as Phase;
  } catch (error) {
    console.error("Error fetching phase:", error);
    throw error;
  }
};

export const createPhase = async (phase: Omit<Phase, 'id' | 'created_at'>): Promise<Phase> => {
  try {    
    const { data, error } = await supabase
      .from('phases')
      .insert([phase])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Phase;
  } catch (error) {
    console.error("Error creating phase:", error);
    throw error;
  }
};

export const updatePhase = async (id: number, phase: Partial<Omit<Phase, 'id' | 'created_at'>>): Promise<Phase> => {
  try {
    const { data, error } = await supabase
      .from('phases')
      .update(phase)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Phase;
  } catch (error) {
    console.error("Error updating phase:", error);
    throw error;
  }
};

export const deletePhase = async (phaseId: number) => {
  const { error } = await supabase
    .from('phases')
    .delete()
    .eq('id', phaseId);

  if (error) throw error;
  return true;
};

export const getQuestionsByPhaseId = async (phaseId: number): Promise<Question[]> => {
  try {
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('phase_id', phaseId)
      .single();

    if (quizError && quizError.code !== 'PGRST116') {
      throw quizError;
    }

    if (!quiz) {
      return [];
    }

    let { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }
    
    const processedQuestions = (questions || []).map(question => {
      let options = question.options;
      
      if (!Array.isArray(options)) {
        try {
          if (typeof options === 'string') {
            options = JSON.parse(options);
          }
        } catch (e) {
          console.error(`Erro ao processar opções da pergunta ${question.id}:`, e);
          options = [];
        }
        
        if (!Array.isArray(options) || options.length === 0) {
          options = ["", "", "", ""];
        }
      }
      
      return {
        ...question,
        options,
        phase_id: phaseId
      };
    });

    return processedQuestions as Question[];
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const saveQuiz = async (phaseId: number, questions: any[]): Promise<boolean> => {
  try {
    let quizId: number;
    
    const { data: existingQuiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('phase_id', phaseId)
      .single();
    
    if (quizError && quizError.code !== 'PGRST116') {
      throw quizError;
    }
    
    if (existingQuiz) {
      quizId = existingQuiz.id;
      
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizId);
  
      if (deleteError) {
        throw deleteError;
      }
    } else {
      const { data: newQuiz, error: createError } = await supabase
        .from('quizzes')
        .insert([{ phase_id: phaseId }])
        .select()
        .single();
      
      if (createError) {
        throw createError;
      }
      
      quizId = newQuiz.id;
    }

    const { error: insertError } = await supabase
      .from('questions')
      .insert(
        questions.map((question, index) => ({
          quiz_id: quizId,
          question: question.question,
          options: question.options,
          correct_answer: question.correct_answer,
          order_index: index,
        }))
      );

    if (insertError) {
      throw insertError;
    }

    return true;
  } catch (error) {
    console.error("Error saving quiz:", error);
    throw error;
  }
};

export const updateUserPhaseStatus = async (userId: string, phaseId: number, status: PhaseStatus): Promise<boolean> => {
  try {
    if (!userId || !phaseId) {
      console.error("Invalid parameters:", { userId, phaseId });
      throw new Error("Invalid parameters: userId and phaseId are required");
    }

    const { data: existingStatus, error: selectError } = await supabase
      .from('user_phases')
      .select('*')
      .eq('user_id', userId)
      .eq('phase_id', phaseId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error("Error checking existing status:", selectError);
      throw selectError;
    }

    const timestamp = new Date().toISOString();
    const updateData = {
      status,
      completed_at: status === 'completed' ? timestamp : null
    };

    if (existingStatus) {
      const { error: updateError } = await supabase
        .from('user_phases')
        .update(updateData)
        .eq('user_id', userId)
        .eq('phase_id', phaseId);

      if (updateError) {
        console.error("Error updating status:", updateError);
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_phases')
        .insert([{
          user_id: userId,
          phase_id: phaseId,
          ...updateData
        }]);

      if (insertError) {
        console.error("Error inserting status:", insertError);
        throw insertError;
      }
    }

    // Ganhar XP quando completa uma fase
    if (status === 'completed') {
      // Importar dinamicamente para evitar dependência circular
      const { updateUserXp } = await import('@/services/profileService');
      await updateUserXp(userId, 50); // 50 XP por fase completada
    }

    return true;
  } catch (error) {
    console.error("Error updating user phase status:", error);
    return false;
  }
};

export const getUserPhaseStatus = async (userId: string, phaseId: number): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('user_phases')
      .select('status')
      .eq('user_id', userId)
      .eq('phase_id', phaseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.status || null;
  } catch (error) {
    console.error("Error getting user phase status:", error);
    return null;
  }
};

export const getModuleProgress = async (userId: string, moduleId: number): Promise<number> => {
  try {
    // Buscar todas as fases do módulo
    const phases = await getPhasesByModuleId(moduleId);
    
    if (phases.length === 0) return 0;
    
    // Buscar os status das fases para o usuário
    const phaseIds = phases.map(phase => phase.id);
    
    const { data, error } = await supabase
      .from('user_phases')
      .select('phase_id, status')
      .eq('user_id', userId)
      .in('phase_id', phaseIds);
    
    if (error) {
      console.error("Error getting module progress:", error);
      return 0;
    }
    
    // Contar fases completadas
    const completedPhases = (data || []).filter(p => p.status === 'completed').length;
    
    // Calcular progresso
    return Math.round((completedPhases / phases.length) * 100);
  } catch (error) {
    console.error("Error calculating module progress:", error);
    return 0;
  }
};

export const isModuleCompleted = async (userId: string, moduleId: number): Promise<boolean> => {
  try {
    // Buscar todas as fases do módulo
    const phases = await getPhasesByModuleId(moduleId);
    
    if (phases.length === 0) return false;
    
    // Buscar os status das fases para o usuário
    const phaseIds = phases.map(phase => phase.id);
    
    const { data, error } = await supabase
      .from('user_phases')
      .select('phase_id, status')
      .eq('user_id', userId)
      .in('phase_id', phaseIds);
    
    if (error) {
      console.error("Error checking module completion:", error);
      return false;
    }
    
    // Verificar se todas as fases estão completas
    const completedPhases = (data || []).filter(p => p.status === 'completed').length;
    return completedPhases === phases.length;
  } catch (error) {
    console.error("Error checking module completion:", error);
    return false;
  }
};

export const getUserNextPhase = async (userId: string, moduleId: number): Promise<Phase | null> => {
  try {
    // Buscar todas as fases do módulo
    const phases = await getPhasesByModuleId(moduleId);
    
    if (phases.length === 0) return null;
    
    // Buscar os status das fases para o usuário
    const phaseIds = phases.map(phase => phase.id);
    
    const { data, error } = await supabase
      .from('user_phases')
      .select('phase_id, status')
      .eq('user_id', userId)
      .in('phase_id', phaseIds);
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error getting user phases:", error);
      return null;
    }
    
    // Se não há dados do usuário, a primeira fase é a próxima
    if (!data || data.length === 0) {
      return phases[0];
    }
    
    // Criar um mapa de status das fases do usuário
    const userPhaseStatus = new Map();
    data.forEach(p => userPhaseStatus.set(p.phase_id, p.status));
    
    // Encontrar a primeira fase que não esteja completa
    for (const phase of phases) {
      const status = userPhaseStatus.get(phase.id) || 'notStarted';
      if (status !== 'completed') {
        return phase;
      }
    }
    
    // Se todas estão completadas, retornar null (módulo completo)
    return null;
  } catch (error) {
    console.error("Error getting next phase:", error);
    return null;
  }
};
