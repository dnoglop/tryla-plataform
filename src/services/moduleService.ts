import { supabase } from "@/integrations/supabase/client";

// --- TIPOS ---
export type PhaseStatus = "notStarted" | "inProgress" | "completed";
export type ModuleType = "autoconhecimento" | "comunicação" | "produtividade" | "carreira" | "habilidades" | "futuro";
export type PhaseType = "texto" | "video" | "quiz" | "desafio";

export interface Module {
  id: number;
  created_at: string;
  name: string;
  description: string | null;
  type: ModuleType;
  emoji: string | null;
  order_index: number | null;
  content: string | null;
  level: string | null;
  entry_trigger: string | null;
  objective: string | null;
  tags: string[] | null;
  pre_requisites: number[] | null;
  problem_statements: string[] | null;
  success_outcomes: string[] | null;
  is_published: boolean;
}

export interface Phase {
  id: number;
  created_at: string;
  module_id: number | null;
  name: string;
  description: string | null;
  type: PhaseType;
  content: string | null;
  video_url: string | null;
  video_notes: string | null;
  duration: number | null;
  order_index: number | null;
  images?: string[] | null;
  status?: PhaseStatus;
  quote?: string | null;
  quote_author?: string | null;
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


// --- FUNÇÕES DE MÓDULOS (CRUD e Busca) ---
export const getModules = async (): Promise<Module[]> => {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data as Module[]) || [];
  } catch (error) {
    console.error("Error in getModules function:", error);
    throw error;
  }
};

export const getModuleById = async (id: number): Promise<Module | null> => {
  try {
    const { data, error } = await supabase.from("modules").select("*").eq("id", id).single();
    if (error) throw error;
    return data ? { ...data, type: data.type as ModuleType } : null;
  } catch (error) {
    console.error("Error fetching module by id:", error);
    throw error;
  }
};

export const createModule = async (module: Omit<Module, "id" | "created_at">): Promise<Module> => {
  try {
    const { data, error } = await supabase.from("modules").insert([module]).select().single();
    if (error) throw error;
    return data as Module;
  } catch (error) {
    console.error("Error creating module:", error);
    throw error;
  }
};

export const updateModule = async (id: number, module: Partial<Module>): Promise<Module> => {
  try {
    const { data, error } = await supabase.from("modules").update(module).eq("id", id).select().single();
    if (error) throw error;
    return data as Module;
  } catch (error) {
    console.error("Error updating module:", error);
    throw error;
  }
};

export const deleteModule = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting module:", error);
    throw error;
  }
};


// --- FUNÇÕES DE FASES ---
export const getPhasesByModuleId = async (moduleId: number): Promise<Phase[]> => {
  try {
    const { data, error } = await supabase
      .from("phases")
      .select("id, created_at, module_id, name, description, type, duration, order_index, content, video_url, video_notes, quote, quote_author")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data as Phase[]) || [];
  } catch (error) {
    console.error("Error fetching phases by module id:", error);
    throw error;
  }
};

export const getPhaseById = async (id: number): Promise<Phase | null> => {
  try {
    const { data, error } = await supabase.from("phases").select("*").eq("id", id).single();
    if (error) throw error;
    return data as Phase | null;
  } catch (error) {
    console.error("Error fetching phase by id:", error);
    throw error;
  }
};

export const createPhase = async (phase: Omit<Phase, "id" | "created_at">): Promise<Phase> => {
  try {
    const { data: createdPhase, error: phaseError } = await supabase.from("phases").insert([phase]).select().single();
    if (phaseError) throw phaseError;
    if (!createdPhase) throw new Error("Falha ao criar fase, nenhum dado retornado.");
    if (createdPhase.type === 'quiz') {
      const { error: quizLinkError } = await supabase.from("quizzes").insert({ phase_id: createdPhase.id });
      if (quizLinkError) throw new Error(`A fase foi criada, mas a ligação do quiz falhou: ${quizLinkError.message}.`);
    }
    return createdPhase as Phase;
  } catch (error) {
    console.error("Erro geral na função createPhase:", error);
    throw error;
  }
};

export const updatePhase = async (id: number, phase: Partial<Omit<Phase, "id" | "created_at">>): Promise<Phase> => {
  try {
    const { data, error } = await supabase.from("phases").update(phase).eq("id", id).select().single();
    if (error) throw error;
    return data as Phase;
  } catch (error) {
    console.error("Error updating phase:", error);
    throw error;
  }
};

export const deletePhase = async (phaseId: number) => {
  const { error } = await supabase.from("phases").delete().eq("id", phaseId);
  if (error) throw error;
  return true;
};


// --- FUNÇÕES DE QUIZ E PERGUNTAS ---
export const getQuestionsByPhaseId = async (phaseId: number): Promise<Question[]> => {
  try {
    const { data: questions, error } = await supabase.from("questions").select("*, tips_question, quizzes!inner(phase_id)").eq("quizzes.phase_id", phaseId).order("order_index", { ascending: true });
    if (error) throw error;
    if (!questions) return [];
    return (questions || []).map((question) => {
      let options = question.options;
      if (typeof options === "string") { try { options = JSON.parse(options); } catch (e) { options = []; } }
      if (!Array.isArray(options) || options.length === 0) { options = ["", "", "", ""]; }
      return { ...question, options: options.map(opt => String(opt)), tips_question: question.tips_question, phase_id: phaseId };
    });
  } catch (error) {
    console.error("Error fetching questions by phase id:", error);
    throw error;
  }
};

export const saveQuiz = async (phaseId: number, questions: any[]): Promise<boolean> => {
  // ... (código existente mantido)
  try {
    let quizId: number;
    const { data: existingQuiz, error: quizError } = await supabase.from("quizzes").select("id").eq("phase_id", phaseId).maybeSingle();
    if (quizError) throw quizError;
    if (existingQuiz) {
      quizId = existingQuiz.id;
      const { error: deleteError } = await supabase.from("questions").delete().eq("quiz_id", quizId);
      if (deleteError) throw deleteError;
    } else {
      const { data: newQuiz, error: createError } = await supabase.from("quizzes").insert([{ phase_id: phaseId }]).select().single();
      if (createError) throw createError;
      quizId = newQuiz.id;
    }
    const { error: insertError } = await supabase.from("questions").insert(questions.map((question, index) => ({ quiz_id: quizId, question: question.question, options: question.options, correct_answer: question.correct_answer, order_index: index, tips_question: question.tips_question })));
    if (insertError) throw insertError;
    return true;
  } catch (error) {
    console.error("Error saving quiz:", error);
    throw error;
  }
};


// --- FUNÇÕES DE PROGRESSO DO USUÁRIO ---
export const getUserPhaseStatus = async (userId: string, phaseId: number): Promise<PhaseStatus> => {
  try {
    const { data, error } = await supabase.from("user_phases").select("status").eq("user_id", userId).eq("phase_id", phaseId).maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    return (data?.status as PhaseStatus) || "notStarted";
  } catch (error) {
    console.error("Error getting user phase status:", error);
    return "notStarted";
  }
};

export const updateUserPhaseStatus = async (userId: string, phaseId: number, status: PhaseStatus): Promise<void> => {
  try {
    await supabase.from("user_phases").upsert({
      user_id: userId,
      phase_id: phaseId,
      status: status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error("Critical error in updateUserPhaseStatus:", error);
    throw error;
  }
};

export const getModuleProgress = async (userId: string, moduleId: number): Promise<number> => {
  try {
    const { count: totalPhases } = await supabase.from("phases").select("*", { count: "exact", head: true }).eq("module_id", moduleId);
    if (totalPhases === null || totalPhases === 0) return 0;
    const { count: completedPhases } = await supabase.from("user_phases").select("*, phases!inner(module_id)", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed").eq("phases.module_id", moduleId);
    return Math.round(((completedPhases || 0) / totalPhases) * 100);
  } catch (error) {
    console.error("Error calculating module progress:", error);
    return 0;
  }
};

export const isModuleCompleted = async (userId: string, moduleId: number): Promise<boolean> => {
  try {
    const { count: totalPhases } = await supabase.from("phases").select("*", { count: "exact", head: true }).eq("module_id", moduleId);
    if (totalPhases === null || totalPhases === 0) return false;
    const { count: completedPhases } = await supabase.from("user_phases").select("*, phases!inner(module_id)", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed").eq("phases.module_id", moduleId);
    return (completedPhases || 0) === totalPhases;
  } catch (error) {
    console.error("Error checking module completion:", error);
    return false;
  }
};

export const getUserNextPhase = async (userId: string, moduleId: number): Promise<Phase | null> => {
  try {
    const phases = await getPhasesByModuleId(moduleId);
    if (phases.length === 0) return null;
    const phaseIds = phases.map((p) => p.id);
    const { data: userPhases } = await supabase.from("user_phases").select("phase_id, status").eq("user_id", userId).in("phase_id", phaseIds);
    const completedPhaseIds = new Set((userPhases || []).filter((p) => p.status === "completed").map((p) => p.phase_id));
    for (const phase of phases) {
      if (!completedPhaseIds.has(phase.id)) return phase;
    }
    return null;
  } catch (error) {
    console.error("Error getting next phase:", error);
    return null;
  }
};

export const getNextModule = async (currentModuleId: number): Promise<(Module & { firstPhaseId?: number }) | null> => {
  try {
    const allModules = await getModules();
    const currentIndex = allModules.findIndex((m) => m.id === currentModuleId);
    if (currentIndex !== -1 && currentIndex < allModules.length - 1) {
      const nextModuleData = allModules[currentIndex + 1];
      const { data: firstPhase, error } = await supabase.from("phases").select("id").eq("module_id", nextModuleData.id).order("order_index", { ascending: true }).limit(1).single();
      if (error) return nextModuleData;
      return { ...nextModuleData, firstPhaseId: firstPhase.id };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar próximo módulo:", error);
    return null;
  }
};


// --- NOVA ARQUITETURA DE CONCLUSÃO DE MÓDULO ---

/**
 * Busca os detalhes de um módulo para calcular as recompensas totais.
 */
export const getModuleDetailsForReward = async (moduleId: number) => {
  const [{ data: moduleData, error: moduleError }, { count, error: countError }] = await Promise.all([
    supabase.from('modules').select('name').eq('id', moduleId).single(),
    supabase.from('phases').select('*', { count: 'exact', head: true }).eq('module_id', moduleId)
  ]);

  if (moduleError || countError) {
    console.error("Erro ao buscar detalhes do módulo para recompensa:", moduleError || countError);
    throw moduleError || countError;
  }

  const phaseCount = count || 0;
  const xpPerPhase = 5;
  const xpBonusModule = 15;
  const coinsBonusModule = 15;

  const totalXp = (phaseCount * xpPerPhase) + xpBonusModule;

  return { totalXp, coins: coinsBonusModule, moduleName: moduleData?.name || "Módulo" };
};

/**
 * Chama a RPC para conceder a recompensa TOTAL de XP de um módulo.
 */
export const grantModuleXpReward = async (userId: string, moduleId: number, totalXp: number) => {
  const { error } = await supabase.rpc('grant_module_xp_reward', {
    p_user_id: userId,
    p_module_id: moduleId,
    p_total_xp_amount: totalXp,
  });

  if (error) {
    // Agora, qualquer erro será visível no console como um erro crítico.
    console.error("❌ Erro na RPC grantModuleXpReward:", error);
    throw error;
  }
};

/**
 * Registra o ganho de moedas na tabela de histórico.
 */
export const recordCoinGain = async (userId: string, amount: number, moduleId: number): Promise<void> => {
  const { error } = await supabase.from("coin_history").insert({
    user_id: userId,
    amount: amount,
    source: "MODULE_COMPLETION",
    source_id: moduleId.toString(),
  });

  if (error) {
      // Agora, qualquer erro será visível no console como um erro crítico.
      console.error("❌ Erro ao registrar ganho de moedas:", error);
      throw error;
  }
};

/**
 * Função SIMPLIFICADA para marcar uma fase como concluída, sem dar recompensas.
 * Usada no novo fluxo de navegação direta.
 */
export const completePhase = async (userId: string, phaseId: number): Promise<void> => {
  await supabase.from('user_phases').upsert({ user_id: userId, phase_id: phaseId, status: 'completed' });
};


// --- FUNÇÕES ANTIGAS (Mantidas para retrocompatibilidade ou uso no Admin) ---

export const awardQuizXp = async (userId: string, phaseId: number, xpAmount: number): Promise<boolean> => {
  // ... (código existente mantido)
  try {
    const { data: existingLog, error } = await supabase.from("xp_history").select("id").eq("user_id", userId).eq("source", "QUIZ_TIME_BONUS").eq("source_id", phaseId.toString()).maybeSingle();
    if (error) throw error;
    if (existingLog) return false;
    const { error: insertError } = await supabase.from("xp_history").insert({ user_id: userId, xp_amount: xpAmount, source: "QUIZ_TIME_BONUS", source_id: phaseId.toString() });
    if (insertError) throw insertError;
    return true;
  } catch (error) {
    console.error("Erro ao conceder XP do quiz:", error);
    return false;
  }
};

export const completePhaseAndAwardXp = async (userId: string, phaseId: number, moduleId: number, isQuiz: boolean = false): Promise<{ xpFromPhase: number; xpFromModule: number; moduleCompleted: boolean; }> => {
  // ... (código existente mantido)
  try {
    const { data, error } = await supabase.rpc("complete_phase_and_award_xp_atomic", { p_user_id: userId, p_phase_id: phaseId, p_module_id: moduleId, p_is_quiz: isQuiz });
    if (error) throw error;
    if (!data || data.length === 0) return { xpFromPhase: 0, xpFromModule: 0, moduleCompleted: false };
    const result = data[0];
    return {
      xpFromPhase: Number(result.xp_ganho_fase) || 0,
      xpFromModule: Number(result.xp_ganho_modulo) || 0,
      moduleCompleted: Boolean(result.modulo_concluido),
    };
  } catch (error) {
    console.error("❌ Erro em completePhaseAndAwardXp:", error);
    throw error;
  }
};