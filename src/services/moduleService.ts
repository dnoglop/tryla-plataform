// ARQUIVO: services/moduleService.ts
// VERSÃO FINAL COM LÓGICA PREDITIVA PARA EVITAR RACE CONDITION

import { supabase } from "@/integrations/supabase/client";

export type PhaseStatus = "notStarted" | "inProgress" | "completed";
export type ModuleType =
  | "autoconhecimento"
  | "empatia"
  | "growth"
  | "comunicacao"
  | "futuro";
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

export const getModules = async (): Promise<Module[]> => {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("id, created_at, name, description, type, emoji, order_index, content")
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data || []).map(module => ({
      ...module,
      type: module.type as ModuleType,
      content: module.content || null
    }));
  } catch (error) {
    console.error("Error fetching modules:", error);
    throw error;
  }
};

export const getModuleById = async (id: number): Promise<Module | null> => {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data ? {
      ...data,
      type: data.type as ModuleType
    } : null;
  } catch (error) {
    console.error("Error fetching module by id:", error);
    throw error;
  }
};

export const createModule = async (
  module: Omit<Module, "id" | "created_at">,
): Promise<Module> => {
  try {
    const { data, error } = await supabase
      .from("modules")
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

export const updateModule = async (
  id: number,
  module: Partial<Module>,
): Promise<Module> => {
  try {
    const { data, error } = await supabase
      .from("modules")
      .update(module)
      .eq("id", id)
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
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Error deleting module:", error);
    throw error;
  }
};

export const getPhasesByModuleId = async (
  moduleId: number,
): Promise<Phase[]> => {
  try {
    const { data, error } = await supabase
      .from("phases")
      .select(
        "id, created_at, module_id, name, description, type, icon_type, duration, order_index, content, video_url, video_notes",
      )
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data || []).map(phase => ({
      ...phase,
      type: phase.type as PhaseType,
      icon_type: phase.icon_type as IconType,
      content: phase.content || null,
      video_url: phase.video_url || null,
      video_notes: phase.video_notes || null
    }));
  } catch (error) {
    console.error("Error fetching phases by module id:", error);
    throw error;
  }
};

export const getPhaseById = async (id: number): Promise<Phase | null> => {
  try {
    const { data, error } = await supabase
      .from("phases")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data ? {
      ...data,
      type: data.type as PhaseType,
      icon_type: data.icon_type as IconType
    } : null;
  } catch (error) {
    console.error("Error fetching phase by id:", error);
    throw error;
  }
};

export const createPhase = async (
  phase: Omit<Phase, "id" | "created_at">,
): Promise<Phase> => {
  try {
    const { data, error } = await supabase
      .from("phases")
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

export const updatePhase = async (
  id: number,
  phase: Partial<Omit<Phase, "id" | "created_at">>,
): Promise<Phase> => {
  try {
    const { data, error } = await supabase
      .from("phases")
      .update(phase)
      .eq("id", id)
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
  const { error } = await supabase.from("phases").delete().eq("id", phaseId);
  if (error) throw error;
  return true;
};

export const getQuestionsByPhaseId = async (
  phaseId: number,
): Promise<Question[]> => {
  try {
    const { data: questions, error } = await supabase
      .from("questions")
      .select("*, tips_question, quizzes!inner(phase_id)")
      .eq("quizzes.phase_id", phaseId)
      .order("order_index", { ascending: true });

    if (error) throw error;
    if (!questions) return [];

    return (questions || []).map((question) => {
      let options = question.options;
      if (typeof options === "string") {
        try {
          options = JSON.parse(options);
        } catch (e) {
          options = [];
        }
      }
      if (!Array.isArray(options) || options.length === 0) {
        options = ["", "", "", ""];
      }
      return {
        ...question,
        options: options.map(opt => String(opt)),
        tips_question: question.tips_question,
        phase_id: phaseId,
      };
    });
  } catch (error) {
    console.error("Error fetching questions by phase id:", error);
    throw error;
  }
};

export const saveQuiz = async (
  phaseId: number,
  questions: any[],
): Promise<boolean> => {
  try {
    let quizId: number;
    const { data: existingQuiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("phase_id", phaseId)
      .maybeSingle();
    if (quizError) throw quizError;

    if (existingQuiz) {
      quizId = existingQuiz.id;
      const { error: deleteError } = await supabase
        .from("questions")
        .delete()
        .eq("quiz_id", quizId);
      if (deleteError) throw deleteError;
    } else {
      const { data: newQuiz, error: createError } = await supabase
        .from("quizzes")
        .insert([{ phase_id: phaseId }])
        .select()
        .single();
      if (createError) throw createError;
      quizId = newQuiz.id;
    }

    const { error: insertError } = await supabase.from("questions").insert(
      questions.map((question, index) => ({
        quiz_id: quizId,
        question: question.question,
        options: question.options,
        correct_answer: question.correct_answer,
        order_index: index,
        tips_question: question.tips_question,
      })),
    );
    if (insertError) throw insertError;
    return true;
  } catch (error) {
    console.error("Error saving quiz:", error);
    throw error;
  }
};

export const getUserPhaseStatus = async (
  userId: string,
  phaseId: number,
): Promise<PhaseStatus> => {
  try {
    const { data, error } = await supabase
      .from("user_phases")
      .select("status")
      .eq("user_id", userId)
      .eq("phase_id", phaseId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return (data?.status as PhaseStatus) || "notStarted";
  } catch (error) {
    console.error("Error getting user phase status:", error);
    return "notStarted";
  }
};

export const updateUserPhaseStatus = async (
  userId: string,
  phaseId: number,
  status: PhaseStatus,
): Promise<void> => {
  try {
    const { error } = await supabase.from("user_phases").upsert({
      user_id: userId,
      phase_id: phaseId,
      status: status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    });

    if (error) throw error;
  } catch (error) {
    console.error("Critical error in updateUserPhaseStatus:", error);
    throw error;
  }
};

export const getModuleProgress = async (
  userId: string,
  moduleId: number,
): Promise<number> => {
  try {
    const { count: totalPhases, error: totalError } = await supabase
      .from("phases")
      .select("*", { count: "exact", head: true })
      .eq("module_id", moduleId);

    if (totalError) throw totalError;
    if (totalPhases === 0 || totalPhases === null) return 0;

    const { count: completedPhases, error: completedError } = await supabase
      .from("user_phases")
      .select("*, phases!inner(module_id)", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")
      .eq("phases.module_id", moduleId);

    if (completedError) throw completedError;

    return Math.round(((completedPhases || 0) / totalPhases) * 100);
  } catch (error) {
    console.error("Error calculating module progress:", error);
    return 0;
  }
};

export const isModuleCompleted = async (
  userId: string,
  moduleId: number,
): Promise<boolean> => {
  try {
    const { count: totalPhases, error: totalError } = await supabase
      .from("phases")
      .select("*", { count: "exact", head: true })
      .eq("module_id", moduleId);

    if (totalError) throw totalError;
    if (totalPhases === 0 || totalPhases === null) return false;

    const { count: completedPhases, error: completedError } = await supabase
      .from("user_phases")
      .select("*, phases!inner(module_id)", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")
      .eq("phases.module_id", moduleId);

    if (completedError) throw completedError;

    return (completedPhases || 0) === totalPhases;
  } catch (error) {
    console.error("Error checking module completion:", error);
    return false;
  }
};

export const getUserNextPhase = async (
  userId: string,
  moduleId: number,
): Promise<Phase | null> => {
  try {
    const phases = await getPhasesByModuleId(moduleId);
    if (phases.length === 0) return null;

    const phaseIds = phases.map((p) => p.id);
    const { data: userPhases, error } = await supabase
      .from("user_phases")
      .select("phase_id, status")
      .eq("user_id", userId)
      .in("phase_id", phaseIds);

    if (error) {
      throw error;
    }

    const completedPhaseIds = new Set(
      (userPhases || [])
        .filter((p) => p.status === "completed")
        .map((p) => p.phase_id),
    );

    for (const phase of phases) {
      if (!completedPhaseIds.has(phase.id)) {
        return phase;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting next phase:", error);
    return null;
  }
};

export const awardQuizXp = async (
  userId: string,
  phaseId: number,
  xpAmount: number,
): Promise<boolean> => {
  try {
    const { data: existingLog, error } = await supabase
      .from("xp_history")
      .select("id")
      .eq("user_id", userId)
      .eq("source", "QUIZ_TIME_BONUS")
      .eq("source_id", phaseId.toString())
      .maybeSingle();

    if (error) throw error;
    if (existingLog) return false;

    const { error: insertError } = await supabase.from("xp_history").insert({
      user_id: userId,
      xp_amount: xpAmount,
      source: "QUIZ_TIME_BONUS",
      source_id: phaseId.toString(),
    });

    if (insertError) throw insertError;
    return true;
  } catch (error) {
    console.error("Erro ao conceder XP do quiz:", error);
    return false;
  }
};

export const completePhase = async (
  userId: string,
  phaseId: number,
): Promise<void> => {
  try {
    await updateUserPhaseStatus(userId, phaseId, "completed");
  } catch (error) {
    console.error("Error completing phase:", error);
    throw error;
  }
};

export const completePhaseAndAwardXp = async (
  userId: string,
  phaseId: number,
  moduleId: number,
  isQuiz: boolean,
): Promise<{ xpFromPhase: number; xpFromModule: number }> => {
  if (!userId || !phaseId || !moduleId) {
    throw new Error("ID do usuário, fase e módulo são obrigatórios.");
  }

  try {
    const { data, error } = await supabase.rpc(
      "complete_phase_and_award_xp_atomic",
      {
        p_user_id: userId,
        p_phase_id: phaseId,
        p_module_id: moduleId,
        p_is_quiz: isQuiz,
      },
    );

    if (error) {
      console.error("Erro ao completar fase e conceder XP via RPC:", error);
      throw error;
    }

    if (data && data.length > 0) {
      return {
        xpFromPhase: data[0].xp_from_phase,
        xpFromModule: data[0].xp_from_module,
      };
    }

    return { xpFromPhase: 0, xpFromModule: 0 };
  } catch (error) {
    console.error("Exceção na chamada RPC completePhaseAndAwardXp:", error);
    throw error;
  }
};
