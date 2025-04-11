
import { supabase } from "@/integrations/supabase/client";

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
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .order("order_index");

  if (error) {
    console.error("Error fetching modules:", error);
    throw error;
  }

  return data || [];
};

export const getModuleById = async (id: number): Promise<Module | null> => {
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching module with id ${id}:`, error);
    return null;
  }

  return data;
};

export const createModule = async (module: Omit<Module, "id" | "created_at" | "updated_at">): Promise<Module> => {
  const { data, error } = await supabase
    .from("modules")
    .insert([module])
    .select()
    .single();

  if (error) {
    console.error("Error creating module:", error);
    throw error;
  }

  return data;
};

export const updateModule = async (id: number, module: Partial<Omit<Module, "id" | "created_at" | "updated_at">>): Promise<Module> => {
  const { data, error } = await supabase
    .from("modules")
    .update(module)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating module with id ${id}:`, error);
    throw error;
  }

  return data;
};

export const deleteModule = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from("modules")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting module with id ${id}:`, error);
    throw error;
  }
};

// Fases
export const getPhasesByModuleId = async (moduleId: number): Promise<Phase[]> => {
  const { data, error } = await supabase
    .from("phases")
    .select("*")
    .eq("module_id", moduleId)
    .order("order_index");

  if (error) {
    console.error(`Error fetching phases for module ${moduleId}:`, error);
    throw error;
  }

  return data || [];
};

export const getPhaseById = async (id: number): Promise<Phase | null> => {
  const { data, error } = await supabase
    .from("phases")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching phase with id ${id}:`, error);
    return null;
  }

  return data;
};

export const createPhase = async (phase: Omit<Phase, "id" | "created_at" | "updated_at">): Promise<Phase> => {
  const { data, error } = await supabase
    .from("phases")
    .insert([phase])
    .select()
    .single();

  if (error) {
    console.error("Error creating phase:", error);
    throw error;
  }

  return data;
};

export const updatePhase = async (id: number, phase: Partial<Omit<Phase, "id" | "created_at" | "updated_at">>): Promise<Phase> => {
  const { data, error } = await supabase
    .from("phases")
    .update(phase)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating phase with id ${id}:`, error);
    throw error;
  }

  return data;
};

export const deletePhase = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from("phases")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting phase with id ${id}:`, error);
    throw error;
  }
};

// Quizzes e Perguntas
export const getQuestionsByPhaseId = async (phaseId: number): Promise<Question[]> => {
  const { data: quizData, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("phase_id", phaseId)
    .single();

  if (quizError) {
    if (quizError.code === "PGRST116") {
      // No quiz found for this phase
      return [];
    }
    console.error(`Error fetching quiz for phase ${phaseId}:`, quizError);
    throw quizError;
  }

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", quizData.id)
    .order("order_index");

  if (questionsError) {
    console.error(`Error fetching questions for quiz ${quizData.id}:`, questionsError);
    throw questionsError;
  }

  return questions || [];
};

export const saveQuiz = async (phaseId: number, questions: Omit<Question, "id" | "quiz_id">[]): Promise<void> => {
  // First, get or create the quiz
  let quizId: number;
  const { data: existingQuiz, error: quizFetchError } = await supabase
    .from("quizzes")
    .select("id")
    .eq("phase_id", phaseId)
    .single();

  if (quizFetchError && quizFetchError.code !== "PGRST116") {
    console.error(`Error fetching quiz for phase ${phaseId}:`, quizFetchError);
    throw quizFetchError;
  }

  if (existingQuiz) {
    quizId = existingQuiz.id;
    
    // Delete existing questions
    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("quiz_id", quizId);
      
    if (deleteError) {
      console.error(`Error deleting existing questions for quiz ${quizId}:`, deleteError);
      throw deleteError;
    }
  } else {
    // Create new quiz
    const { data: newQuiz, error: insertError } = await supabase
      .from("quizzes")
      .insert([{ phase_id: phaseId }])
      .select()
      .single();
      
    if (insertError) {
      console.error(`Error creating quiz for phase ${phaseId}:`, insertError);
      throw insertError;
    }
    
    quizId = newQuiz.id;
  }
  
  // Insert new questions
  if (questions.length > 0) {
    const questionsWithQuizId = questions.map(q => ({
      ...q,
      quiz_id: quizId
    }));
    
    const { error: insertQuestionsError } = await supabase
      .from("questions")
      .insert(questionsWithQuizId);
      
    if (insertQuestionsError) {
      console.error(`Error inserting questions for quiz ${quizId}:`, insertQuestionsError);
      throw insertQuestionsError;
    }
  }
};
