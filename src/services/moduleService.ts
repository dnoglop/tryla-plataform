import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define module and phase types
export interface Module {
  id: number;
  name: string;
  description?: string;
  type?: "autoconhecimento" | "empatia" | "growth" | "comunicacao" | "futuro";
  emoji?: string;
  order_index: number;
  content?: string;
  created_at?: string;
  updated_at?: string;
}

export type ModuleType = "autoconhecimento" | "empatia" | "growth" | "comunicacao" | "futuro";
export type PhaseType = "video" | "text" | "quiz" | "challenge";
export type IconType = "video" | "quiz" | "challenge" | "game";
export type PhaseStatus = "completed" | "inProgress" | "available" | "locked";

export interface Phase {
  id: number;
  name: string;
  description?: string;
  type?: PhaseType;
  icon_type?: IconType;
  content?: string;
  video_url?: string;
  video_notes?: string;
  videoId?: string;
  images?: string[];
  duration?: number;
  order_index: number;
  module_id?: number;
  created_at?: string;
  updated_at?: string;
  status?: PhaseStatus;
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
    
    if (error) {
      toast.error(`Erro ao buscar módulos: ${error.message}`);
      throw error;
    }
    
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
      .maybeSingle();
    
    if (error) {
      // Não lançar erro se for apenas um "not found"
      if (error.code === 'PGRST116') {
        return null;
      }
      toast.error(`Erro ao buscar módulo: ${error.message}`);
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
    console.log("Creating module with data:", module);
    const { data, error } = await supabase
      .from("modules")
      .insert(module)
      .select()
      .maybeSingle();
    
    if (error) {
      if (error.message.includes("violates row-level security policy")) {
        toast.error("Erro de permissão: Você não tem autorização para criar módulos.");
        throw new Error("Erro de permissão: Você não tem autorização para criar módulos. Verifique suas permissões.");
      }
      toast.error(`Erro ao criar módulo: ${error.message}`);
      throw error;
    }
    
    if (!data) {
      toast.error("Nenhum dado retornado após criar módulo");
      throw new Error("No data returned after creating module");
    }
    
    toast.success("Módulo criado com sucesso!");
    
    // Cast para garantir o tipo correto
    return data as unknown as Module;
  } catch (error) {
    console.error("Error creating module:", error);
    throw error;
  }
};

export const updateModule = async (id: number, module: Partial<Omit<Module, "id" | "created_at" | "updated_at">>): Promise<Module> => {
  try {
    console.log("Updating module:", id, "with data:", module);
    const { data, error } = await supabase
      .from("modules")
      .update(module)
      .eq("id", id)
      .select()
      .maybeSingle();
    
    if (error) {
      if (error.message.includes("violates row-level security policy")) {
        toast.error("Erro de permissão: Você não tem autorização para atualizar módulos.");
        throw new Error("Erro de permissão: Você não tem autorização para atualizar módulos. Verifique suas permissões.");
      }
      toast.error(`Erro ao atualizar módulo: ${error.message}`);
      throw error;
    }
    
    if (!data) {
      toast.error(`Módulo com ID ${id} não encontrado`);
      throw new Error(`Module with id ${id} not found`);
    }
    
    toast.success("Módulo atualizado com sucesso!");
    
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
    
    if (error) {
      if (error.message.includes("violates row-level security policy")) {
        toast.error("Erro de permissão: Você não tem autorização para excluir módulos.");
        throw new Error("Erro de permissão: Você não tem autorização para excluir módulos. Verifique suas permissões.");
      }
      toast.error(`Erro ao excluir módulo: ${error.message}`);
      throw error;
    }
    
    toast.success("Módulo excluído com sucesso!");
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
    
    if (error) {
      toast.error(`Erro ao buscar fases: ${error.message}`);
      throw error;
    }
    
    // Processar dados para adicionar o status padrão como "available"
    // Em uma implementação mais completa, buscaríamos o status real do user_phase_progress
    const phasesWithStatus = (data || []).map(phase => ({
      ...phase,
      status: "available" as PhaseStatus,
      // Process video_url to extract videoId if present
      videoId: phase.video_url ? extractVideoId(phase.video_url) : undefined,
      // Convert video_notes to videoNotes for consistency
      video_notes: phase.video_notes,
      // For now, no images in the database, so we'll leave it as an empty array
      images: []
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
      .maybeSingle();
    
    if (error) {
      // Não lançar erro se for apenas um "not found"
      if (error.code === 'PGRST116') {
        return null;
      }
      toast.error(`Erro ao buscar fase: ${error.message}`);
      throw error;
    }
    
    if (!data) return null;
    
    // Process the phase data to match our expected Phase interface
    const processedPhase: Phase = {
      ...data,
      status: "available" as PhaseStatus,
      // Process video_url to extract videoId if present
      videoId: data.video_url ? extractVideoId(data.video_url) : undefined,
      // For now, no images in the database, so we'll leave it as an empty array
      images: [],
      // Ensure type is properly cast as PhaseType
      type: data.type as PhaseType,
      // Ensure icon_type is properly cast as IconType
      icon_type: (data.icon_type as IconType) || "challenge",
    };
    
    return processedPhase;
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
      .maybeSingle();
    
    if (error) {
      if (error.message.includes("violates row-level security policy")) {
        toast.error("Erro de permissão: Você não tem autorização para criar fases.");
        throw new Error("Erro de permissão: Você não tem autorização para criar fases. Verifique suas permissões.");
      }
      toast.error(`Erro ao criar fase: ${error.message}`);
      throw error;
    }
    
    if (!data) {
      toast.error("Nenhum dado retornado após criar fase");
      throw new Error("No data returned after creating phase");
    }
    
    toast.success("Fase criada com sucesso!");
    
    // Cast para garantir o tipo correto
    return data as unknown as Phase;
  } catch (error) {
    console.error("Error creating phase:", error);
    throw error;
  }
};

export const updatePhase = async (id: number, phase: Partial<Omit<Phase, "id" | "created_at" | "updated_at" | "status">>): Promise<Phase> => {
  try {
    // Use maybeSingle() instead of single() to avoid the error
    const { data, error } = await supabase
      .from("phases")
      .update(phase)
      .eq("id", id)
      .select()
      .maybeSingle();
    
    if (error) {
      if (error.message.includes("violates row-level security policy")) {
        throw new Error("Erro de permissão: Você não tem autorização para atualizar fases. Verifique suas permissões.");
      }
      throw error;
    }
    
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
    
    if (error) {
      if (error.message.includes("violates row-level security policy")) {
        throw new Error("Erro de permissão: Você não tem autorização para excluir fases. Verifique suas permissões.");
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error deleting phase with id ${id}:`, error);
    throw error;
  }
};

// Quizzes e Perguntas
export const getQuestionsByPhaseId = async (phaseId: number): Promise<Question[]> => {
  try {
    console.log(`Fetching questions for phase ${phaseId}`);
    
    // Primeiro, encontrar o quiz relacionado à fase
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("phase_id", phaseId)
      .maybeSingle();
    
    if (quizError) {
      // Se não encontrar o quiz, retorna array vazio
      if (quizError.code === 'PGRST116') {
        console.log(`No quiz found for phase ${phaseId}`);
        return [];
      }
      console.error("Error finding quiz for phase:", quizError);
      throw quizError;
    }
    
    if (!quizData) {
      console.log(`No quiz found for phase ${phaseId}`);
      return [];
    }
    
    console.log(`Found quiz ID ${quizData.id} for phase ${phaseId}`);
    
    // Depois, buscar todas as perguntas relacionadas ao quiz
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizData.id)
      .order("order_index");
    
    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      throw questionsError;
    }
    
    console.log(`Raw questions data for phase ${phaseId}:`, questionsData);
    
    if (!questionsData || questionsData.length === 0) {
      console.log(`No questions found for quiz ${quizData.id} (phase ${phaseId})`);
      return [];
    }
    
    // Converter as opções do formato JSONB para array
    const questions = questionsData.map(q => {
      const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options as unknown as string);
      console.log(`Processed question ${q.id}: "${q.question}" with options:`, options, `and correct answer: ${q.correct_answer}`);
      
      return {
        ...q,
        options: options
      };
    });
    
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
    
    if (checkError) {
      console.error("Error checking existing quiz:", checkError);
      throw checkError;
    }
    
    // Se já existe um quiz, retornar o id existente
    if (existingQuiz) return existingQuiz.id;
    
    // Criar novo quiz
    const { data: newQuiz, error } = await supabase
      .from("quizzes")
      .insert([{ phase_id: phaseId }])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating new quiz:", error);
      throw error;
    }
    if (!newQuiz) throw new Error("No data returned after creating quiz");
    
    console.log("Created new quiz for phase", phaseId, ":", newQuiz);
    return newQuiz.id;
  } catch (error) {
    console.error(`Error creating quiz for phase ${phaseId}:`, error);
    return null;
  }
};

export const saveQuiz = async (phaseId: number, questions: Omit<Question, "id" | "quiz_id">[]): Promise<void> => {
  try {
    console.log("Saving quiz for phase", phaseId, "with questions:", questions);
    
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
    
    if (deleteError) {
      console.error("Error deleting existing questions:", deleteError);
      throw deleteError;
    }
    
    // Inserir novas perguntas
    if (questionsToInsert.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from("questions")
        .insert(questionsToInsert)
        .select();
      
      if (insertError) {
        console.error("Error inserting questions:", insertError);
        throw insertError;
      }
      
      console.log("Inserted questions:", insertedData);
    }
    
    // IMPORTANT: Update the phase type to quiz
    console.log("Updating phase type to quiz for phase ID:", phaseId);
    const { data: phase, error: phaseError } = await supabase
      .from("phases")
      .update({ type: "quiz" })
      .eq("id", phaseId)
      .select()
      .single();
    
    if (phaseError) {
      console.error("Error updating phase type to quiz:", phaseError);
      throw phaseError;
    }
    
    console.log("Updated phase:", phase);
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

// Helper function to extract YouTube video ID from a URL
function extractVideoId(url: string): string | undefined {
  if (!url) return undefined;
  
  // Handle youtu.be format
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1];
    return id.split('?')[0].split('&')[0];
  }
  
  // Handle youtube.com format
  const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return videoIdMatch ? videoIdMatch[1] : undefined;
}
