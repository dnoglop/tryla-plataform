
import { supabase } from "@/integrations/supabase/client";

// Define module and phase types
export interface Module {
  id: number;
  name: string;
  description?: string;
  type?: "autoconhecimento" | "empatia" | "growth" | "comunicacao" | "futuro";
  emoji?: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface Phase {
  id: number;
  module_id: number;
  name: string;
  description: string;
  type: "video" | "text" | "quiz" | "challenge";
  icon_type: "video" | "quiz" | "challenge" | "game";
  content?: string;
  video_url?: string;
  duration?: number;
  order_index: number;
  created_at?: string;
  updated_at?: string;
  status?: "completed" | "inProgress" | "available" | "locked";
}

export interface Question {
  id: number;
  quiz_id: number;
  question: string;
  options: string[];
  correct_answer: number;
  order_index: number;
}

// Módulos
export const getModules = async (): Promise<Module[]> => {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .order("order_index");
    
    if (error) throw error;
    
    // Cast para garantir o tipo correto
    const typedData = data as unknown as Module[];
    return typedData || [];
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
    
    if (error) {
      // Não lançar erro se for apenas um "not found"
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    // Cast para garantir o tipo correto
    return data as unknown as Module;
  } catch (error) {
    console.error(`Error fetching module with id ${id}:`, error);
    return null;
  }
};

export const createModule = async (module: Omit<Module, "id" | "created_at" | "updated_at">): Promise<Module> => {
  try {
    const { data, error } = await supabase
      .from("modules")
      .insert(module)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error("No data returned after creating module");
    
    // Cast para garantir o tipo correto
    return data as unknown as Module;
  } catch (error) {
    console.error("Error creating module:", error);
    throw error;
  }
};

export const updateModule = async (id: number, module: Partial<Omit<Module, "id" | "created_at" | "updated_at">>): Promise<Module> => {
  try {
    const { data, error } = await supabase
      .from("modules")
      .update(module)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error(`Module with id ${id} not found`);
    
    // Cast para garantir o tipo correto
    return data as unknown as Module;
  } catch (error) {
    console.error(`Error updating module with id ${id}:`, error);
    throw error;
  }
};

export const deleteModule = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting module with id ${id}:`, error);
    throw error;
  }
};

// Fases
export const getPhasesByModuleId = async (moduleId: number): Promise<Phase[]> => {
  try {
    const { data, error } = await supabase
      .from("phases")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_index");
    
    if (error) throw error;
    
    // Processar dados para adicionar o status padrão como "available"
    // Em uma implementação mais completa, buscaríamos o status real do user_phase_progress
    const phasesWithStatus = (data || []).map(phase => ({
      ...phase,
      status: "available" as "available" | "inProgress" | "completed" | "locked" 
    }));
    
    // Cast para garantir o tipo correto
    return phasesWithStatus as unknown as Phase[];
  } catch (error) {
    console.error(`Error fetching phases for module ${moduleId}:`, error);
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
    
    if (error) {
      // Não lançar erro se for apenas um "not found"
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    // Cast para garantir o tipo correto
    return data as unknown as Phase;
  } catch (error) {
    console.error(`Error fetching phase with id ${id}:`, error);
    return null;
  }
};

export const createPhase = async (phase: Omit<Phase, "id" | "created_at" | "updated_at" | "status">): Promise<Phase> => {
  try {
    const { data, error } = await supabase
      .from("phases")
      .insert(phase)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error("No data returned after creating phase");
    
    // Cast para garantir o tipo correto
    return data as unknown as Phase;
  } catch (error) {
    console.error("Error creating phase:", error);
    throw error;
  }
};

export const updatePhase = async (id: number, phase: Partial<Omit<Phase, "id" | "created_at" | "updated_at" | "status">>): Promise<Phase> => {
  try {
    const { data, error } = await supabase
      .from("phases")
      .update(phase)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error(`Phase with id ${id} not found`);
    
    // Cast para garantir o tipo correto
    return data as unknown as Phase;
  } catch (error) {
    console.error(`Error updating phase with id ${id}:`, error);
    throw error;
  }
};

export const deletePhase = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from("phases")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting phase with id ${id}:`, error);
    throw error;
  }
};

// Quizzes e Perguntas
export const getQuestionsByPhaseId = async (phaseId: number): Promise<Question[]> => {
  try {
    // Primeiro, encontrar o quiz relacionado à fase
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("phase_id", phaseId)
      .single();
    
    if (quizError) {
      // Se não encontrar o quiz, retorna array vazio
      if (quizError.code === 'PGRST116') {
        return [];
      }
      throw quizError;
    }
    
    if (!quizData) return [];
    
    // Depois, buscar todas as perguntas relacionadas ao quiz
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizData.id)
      .order("order_index");
    
    if (questionsError) throw questionsError;
    
    // Converter as opções do formato JSONB para array
    const questions = questionsData?.map(q => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as unknown as string)
    })) || [];
    
    return questions as Question[];
  } catch (error) {
    console.error(`Error fetching questions for phase ${phaseId}:`, error);
    throw error;
  }
};

export const createQuiz = async (phaseId: number): Promise<number | null> => {
  try {
    // Verificar se já existe um quiz para esta fase
    const { data: existingQuiz, error: checkError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("phase_id", phaseId)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    // Se já existe um quiz, retornar o id existente
    if (existingQuiz) return existingQuiz.id;
    
    // Criar novo quiz
    const { data: newQuiz, error } = await supabase
      .from("quizzes")
      .insert([{ phase_id: phaseId }])
      .select()
      .single();
    
    if (error) throw error;
    if (!newQuiz) throw new Error("No data returned after creating quiz");
    
    return newQuiz.id;
  } catch (error) {
    console.error(`Error creating quiz for phase ${phaseId}:`, error);
    return null;
  }
};

export const saveQuiz = async (phaseId: number, questions: Omit<Question, "id" | "quiz_id">[]): Promise<void> => {
  try {
    // Criar ou obter o quiz
    const quizId = await createQuiz(phaseId);
    if (!quizId) throw new Error("Failed to create or get quiz");
    
    // Preparar as perguntas com o quiz_id
    const questionsToInsert = questions.map(q => ({
      ...q,
      quiz_id: quizId
    }));
    
    // Primeiro, remover perguntas existentes
    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("quiz_id", quizId);
    
    if (deleteError) throw deleteError;
    
    // Inserir novas perguntas
    if (questionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("questions")
        .insert(questionsToInsert);
      
      if (insertError) throw insertError;
    }
    
    console.log(`Quiz saved for phase ${phaseId} with ${questions.length} questions`);
  } catch (error) {
    console.error(`Error saving quiz for phase ${phaseId}:`, error);
    throw error;
  }
};

// Funções para gerenciar progresso do usuário
export const getUserModuleProgress = async (userId: string, moduleId: number) => {
  try {
    const { data, error } = await supabase
      .from("user_module_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user module progress:", error);
    return null;
  }
};

export const updateUserModuleProgress = async (userId: string, moduleId: number, progress: number, completed: boolean = false) => {
  try {
    const currentTime = new Date().toISOString();
    const updateData: any = { progress };
    
    if (completed) {
      updateData.completed = true;
      updateData.completed_at = currentTime;
    }
    
    // Verificar se já existe um registro de progresso
    const { data: existingProgress } = await supabase
      .from("user_module_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .maybeSingle();
    
    if (existingProgress) {
      // Atualizar registro existente
      const { error } = await supabase
        .from("user_module_progress")
        .update(updateData)
        .eq("user_id", userId)
        .eq("module_id", moduleId);
      
      if (error) throw error;
    } else {
      // Criar novo registro
      const { error } = await supabase
        .from("user_module_progress")
        .insert({
          user_id: userId,
          module_id: moduleId,
          progress,
          completed,
          completed_at: completed ? currentTime : null,
          started_at: currentTime
        });
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error updating user module progress:", error);
    return false;
  }
};

export const getUserPhaseStatus = async (userId: string, phaseId: number) => {
  try {
    const { data, error } = await supabase
      .from("user_phase_progress")
      .select("status")
      .eq("user_id", userId)
      .eq("phase_id", phaseId)
      .maybeSingle();
    
    if (error) throw error;
    return data?.status || "available";
  } catch (error) {
    console.error("Error fetching user phase status:", error);
    return "available";
  }
};

export const updateUserPhaseStatus = async (userId: string, phaseId: number, status: "available" | "inProgress" | "completed" | "locked", rating?: number) => {
  try {
    const currentTime = new Date().toISOString();
    const updateData: any = { status };
    
    if (status === "inProgress" && !updateData.started_at) {
      updateData.started_at = currentTime;
    }
    
    if (status === "completed") {
      updateData.completed_at = currentTime;
      if (rating) updateData.rating = rating;
    }
    
    // Verificar se já existe um registro
    const { data: existingProgress } = await supabase
      .from("user_phase_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("phase_id", phaseId)
      .maybeSingle();
    
    if (existingProgress) {
      // Atualizar registro existente
      const { error } = await supabase
        .from("user_phase_progress")
        .update(updateData)
        .eq("user_id", userId)
        .eq("phase_id", phaseId);
      
      if (error) throw error;
    } else {
      // Criar novo registro
      const { error } = await supabase
        .from("user_phase_progress")
        .insert({
          user_id: userId,
          phase_id: phaseId,
          ...updateData
        });
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error updating user phase status:", error);
    return false;
  }
};
