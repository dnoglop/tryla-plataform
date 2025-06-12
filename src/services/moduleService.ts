// ARQUIVO: services/moduleService.ts
// CÓDIGO COMPLETO E ATUALIZADO

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
  tips_question?: string | null;
}

// --- FUNÇÕES EXISTENTES (sem alterações) ---
export const getModules = async (): Promise<Module[]> => {
  try {
    let { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) { throw error; }
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
    if (error) { throw error; }
    return module as Module;
  } catch (error) {
    console.error("Error fetching module:", error);
    throw error;
  }
};

export const createModule = async (module: Omit<Module, 'id' | 'created_at'>): Promise<Module> => {
  try {
    const { data, error } = await supabase.from('modules').insert([module]).select().single();
    if (error) { throw error; }
    return data as Module;
  } catch (error) {
    console.error("Error creating module:", error);
    throw error;
  }
};

export const updateModule = async (id: number, module: Partial<Module>): Promise<Module> => {
  try {
    const { data, error } = await supabase.from('modules').update(module).eq('id', id).select().single();
    if (error) { throw error; }
    return data as Module;
  } catch (error) {
    console.error("Error updating module:", error);
    throw error;
  }
};

export const deleteModule = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase.from('modules').delete().eq('id', id);
    if (error) { throw error; }
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
    if (error) { throw error; }
    return (phases || []).map(phase => ({ ...phase })) as Phase[];
  } catch (error) {
    console.error("Error fetching phases:", error);
    throw error;
  }
};

export const getPhaseById = async (id: number): Promise<Phase | null> => {
  try {
    let { data: phase, error } = await supabase.from('phases').select('*').eq('id', id).single();
    if (error) { throw error; }
    return phase as Phase;
  } catch (error) {
    console.error("Error fetching phase:", error);
    throw error;
  }
};

export const createPhase = async (phase: Omit<Phase, 'id' | 'created_at'>): Promise<Phase> => {
  try {    
    const { data, error } = await supabase.from('phases').insert([phase]).select().single();
    if (error) { throw error; }
    return data as Phase;
  } catch (error) {
    console.error("Error creating phase:", error);
    throw error;
  }
};

export const updatePhase = async (id: number, phase: Partial<Omit<Phase, 'id' | 'created_at'>>): Promise<Phase> => {
  try {
    const { data, error } = await supabase.from('phases').update(phase).eq('id', id).select().single();
    if (error) { throw error; }
    return data as Phase;
  } catch (error) {
    console.error("Error updating phase:", error);
    throw error;
  }
};

export const deletePhase = async (phaseId: number) => {
  const { error } = await supabase.from('phases').delete().eq('id', phaseId);
  if (error) throw error;
  return true;
};

export const getQuestionsByPhaseId = async (phaseId: number): Promise<Question[]> => {
  try {
    const { data: quiz, error: quizError } = await supabase.from('quizzes').select('id').eq('phase_id', phaseId).single();
    if (quizError && quizError.code !== 'PGRST116') { throw quizError; }
    if (!quiz) { return []; }

    let { data: questions, error } = await supabase.from('questions').select('*, tips_question').eq('quiz_id', quiz.id).order('order_index', { ascending: true });
    if (error) { throw error; }
    
    return (questions || []).map(question => {
      let options = question.options;
      if (typeof options === 'string') { try { options = JSON.parse(options); } catch (e) { options = []; } }
      if (!Array.isArray(options) || options.length === 0) { options = ["", "", "", ""]; }
      return { ...question, options, tips_question: question.tips_question, phase_id: phaseId };
    }) as Question[];
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const saveQuiz = async (phaseId: number, questions: any[]): Promise<boolean> => {
  try {
    let quizId: number;
    const { data: existingQuiz, error: quizError } = await supabase.from('quizzes').select('id').eq('phase_id', phaseId).single();
    if (quizError && quizError.code !== 'PGRST116') { throw quizError; }
    
    if (existingQuiz) {
      quizId = existingQuiz.id;
      const { error: deleteError } = await supabase.from('questions').delete().eq('quiz_id', quizId);
      if (deleteError) { throw deleteError; }
    } else {
      const { data: newQuiz, error: createError } = await supabase.from('quizzes').insert([{ phase_id: phaseId }]).select().single();
      if (createError) { throw createError; }
      quizId = newQuiz.id;
    }

    const { error: insertError } = await supabase.from('questions').insert(
        questions.map((question, index) => ({
          quiz_id: quizId,
          question: question.question,
          options: question.options,
          correct_answer: question.correct_answer,
          order_index: index,
          tips_question: question.tips_question,
        }))
    );
    if (insertError) { throw insertError; }
    return true;
  } catch (error) {
    console.error("Error saving quiz:", error);
    throw error;
  }
};

export const getUserPhaseStatus = async (userId: string, phaseId: number): Promise<string | null> => {
  try {
    const { data, error } = await supabase.from('user_phases').select('status').eq('user_id', userId).eq('phase_id', phaseId).single();
    if (error && error.code !== 'PGRST116') { throw error; }
    return data?.status || null;
  } catch (error) {
    console.error("Error getting user phase status:", error);
    return null;
  }
};

export const getModuleProgress = async (userId: string, moduleId: number): Promise<number> => {
  try {
    const phases = await getPhasesByModuleId(moduleId);
    if (phases.length === 0) return 0;
    const phaseIds = phases.map(phase => phase.id);
    const { data, error } = await supabase.from('user_phases').select('phase_id, status').eq('user_id', userId).in('phase_id', phaseIds);
    if (error) { console.error("Error getting module progress:", error); return 0; }
    const completedPhases = (data || []).filter(p => p.status === 'completed').length;
    return Math.round((completedPhases / phases.length) * 100);
  } catch (error) {
    console.error("Error calculating module progress:", error);
    return 0;
  }
};

export const isModuleCompleted = async (userId: string, moduleId: number): Promise<boolean> => {
  try {
    const phases = await getPhasesByModuleId(moduleId);
    if (phases.length === 0) return false;
    const phaseIds = phases.map(phase => phase.id);
    const { data, error } = await supabase.from('user_phases').select('phase_id, status').eq('user_id', userId).in('phase_id', phaseIds);
    if (error) { console.error("Error checking module completion:", error); return false; }
    const completedPhases = (data || []).filter(p => p.status === 'completed').length;
    return completedPhases === phases.length;
  } catch (error) {
    console.error("Error checking module completion:", error);
    return false;
  }
};

export const getUserNextPhase = async (userId: string, moduleId: number): Promise<Phase | null> => {
  try {
    const phases = await getPhasesByModuleId(moduleId);
    if (phases.length === 0) return null;
    const phaseIds = phases.map(phase => phase.id);
    const { data, error } = await supabase.from('user_phases').select('phase_id, status').eq('user_id', userId).in('phase_id', phaseIds);
    if (error && error.code !== 'PGRST116') { console.error("Error getting user phases:", error); return null; }
    if (!data || data.length === 0) { return phases[0]; }
    const userPhaseStatus = new Map();
    data.forEach(p => userPhaseStatus.set(p.phase_id, p.status));
    for (const phase of phases) {
      const status = userPhaseStatus.get(phase.id) || 'notStarted';
      if (status !== 'completed') { return phase; }
    }
    return null;
  } catch (error) {
    console.error("Error getting next phase:", error);
    return null;
  }
};

// --- ALTERAÇÃO 1: NOVAS FUNÇÕES DE GAMIFICAÇÃO ATUALIZADAS PARA A TABELA 'xp_history' ---

/**
 * Concede XP para um quiz, garantindo que seja concedido apenas uma vez.
 * Retorna true se o XP foi concedido, false caso contrário.
 */
export const awardQuizXp = async (userId: string, phaseId: number, xpAmount: number): Promise<boolean> => {
  try {
    // 1. Verifica se já existe um registro de XP para este quiz
    const { data: existingLog, error: checkError } = await supabase
      .from('xp_history')
      .select('id')
      .eq('user_id', userId)
      .eq('source', 'QUIZ_TIME_BONUS') // Usamos uma 'source' específica para o bônus de tempo
      .eq('source_id', phaseId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingLog) {
      console.log(`XP para o quiz ${phaseId} já foi concedido.`);
      return false; // XP já foi dado, não faz nada.
    }

    // 2. Se não existir, insere o novo registro de XP
    const { error: insertError } = await supabase.from('xp_history').insert({
      user_id: userId,
      xp_amount: xpAmount,
      source: 'QUIZ_TIME_BONUS',
      source_id: String(phaseId),
    });

    if (insertError) throw insertError;
    return true; // XP concedido com sucesso
  } catch (error) {
    console.error("Erro ao conceder XP do quiz:", error);
    return false;
  }
};

/**
 * Marca uma fase como concluída e concede XP (5 para fase, 15 para módulo) se for a primeira vez.
 * Retorna o total de XP ganho para exibir no modal.
 */
export const completePhaseAndAwardXp = async (userId: string, phaseId: number, moduleId: number, isQuiz: boolean): Promise<{ xpFromPhase: number; xpFromModule: number }> => {
  if (!userId || !phaseId || !moduleId) throw new Error("ID do usuário, fase e módulo são obrigatórios.");

  let awardedXp = { xpFromPhase: 0, xpFromModule: 0 };

  // 1. Verifica se a fase já foi concluída na tabela 'user_phases'
  const currentStatus = await getUserPhaseStatus(userId, phaseId);

  // Se a fase ainda não foi concluída, prossiga
  if (currentStatus !== 'completed') {
    // 2. Marca a fase como concluída no banco de dados
    await supabase.from('user_phases').upsert(
      { user_id: userId, phase_id: phaseId, status: 'completed', completed_at: new Date().toISOString() },
      { onConflict: 'user_id, phase_id' }
    );
    
    // 3. Concede 5 XP pela conclusão da fase (exceto para quizzes, que têm pontuação própria)
    if (!isQuiz) {
        const { error } = await supabase.from('xp_history').insert({
            user_id: userId,
            xp_amount: 5, // Valor fixo de 5XP por fase
            source: 'PHASE_COMPLETION',
            source_id: String(phaseId),
        });
        // Se não houver erro, atualiza o valor de XP ganho. Ignora erro de duplicata.
        if (!error) {
            awardedXp.xpFromPhase = 5;
        }
    }
    
    // 4. Verifica se a conclusão desta fase completou o módulo
    const moduleIsNowComplete = await isModuleCompleted(userId, moduleId);

    if (moduleIsNowComplete) {
      // 5. Verifica se o XP do módulo já foi concedido
      const { data: moduleLog } = await supabase.from('xp_history').select('id').eq('user_id', userId).eq('source', 'MODULE_COMPLETION').eq('source_id', moduleId).maybeSingle();
      
      if (!moduleLog) {
        // Se não foi, concede 15 XP por ele
        const { error: moduleXpError } = await supabase.from('xp_history').insert({
          user_id: userId,
          xp_amount: 15, // Valor fixo de 15XP por módulo
          source: 'MODULE_COMPLETION',
          source_id: String(moduleId),
        });

        if (!moduleXpError) {
            awardedXp.xpFromModule = 15;
        }
      }
    }
  }

  // Retorna os valores de XP para o front-end exibir o modal
  return awardedXp;
};