
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

// Mock implementation using local data until database is set up
// These functions will be replaced with actual database calls once tables are created

// Módulos
export const getModules = async (): Promise<Module[]> => {
  try {
    // For now, return mock data - this will be replaced with actual DB query
    return [
      {
        id: 1,
        name: "Autoconhecimento",
        description: "Conheça a si mesmo e descubra seus superpoderes",
        type: "autoconhecimento",
        emoji: "🧠",
        order_index: 0
      },
      {
        id: 2,
        name: "Empatia",
        description: "Entenda melhor os outros e fortaleça suas relações",
        type: "empatia",
        emoji: "❤️",
        order_index: 1
      },
      {
        id: 3,
        name: "Growth Mindset",
        description: "Desenvolva uma mentalidade de crescimento",
        type: "growth",
        emoji: "🌱",
        order_index: 2
      }
    ];
  } catch (error) {
    console.error("Error fetching modules:", error);
    throw error;
  }
};

export const getModuleById = async (id: number): Promise<Module | null> => {
  try {
    // For now, return mock data - this will be replaced with actual DB query
    const modules = await getModules();
    return modules.find(module => module.id === id) || null;
  } catch (error) {
    console.error(`Error fetching module with id ${id}:`, error);
    return null;
  }
};

export const createModule = async (module: Omit<Module, "id" | "created_at" | "updated_at">): Promise<Module> => {
  try {
    // Mock implementation - will be replaced with actual DB insert
    const modules = await getModules();
    const newId = Math.max(...modules.map(m => m.id)) + 1;
    
    const newModule = {
      id: newId,
      ...module,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Created module:", newModule);
    return newModule;
  } catch (error) {
    console.error("Error creating module:", error);
    throw error;
  }
};

export const updateModule = async (id: number, module: Partial<Omit<Module, "id" | "created_at" | "updated_at">>): Promise<Module> => {
  try {
    // Mock implementation - will be replaced with actual DB update
    const existingModule = await getModuleById(id);
    
    if (!existingModule) {
      throw new Error(`Module with id ${id} not found`);
    }
    
    const updatedModule = {
      ...existingModule,
      ...module,
      updated_at: new Date().toISOString()
    };
    
    console.log("Updated module:", updatedModule);
    return updatedModule;
  } catch (error) {
    console.error(`Error updating module with id ${id}:`, error);
    throw error;
  }
};

export const deleteModule = async (id: number): Promise<void> => {
  try {
    // Mock implementation - will be replaced with actual DB delete
    console.log(`Deleted module with id ${id}`);
  } catch (error) {
    console.error(`Error deleting module with id ${id}:`, error);
    throw error;
  }
};

// Fases
export const getPhasesByModuleId = async (moduleId: number): Promise<Phase[]> => {
  try {
    // For now, return mock data - this will be replaced with actual DB query
    if (moduleId === 1) {
      return [
        {
          id: 1,
          module_id: 1,
          name: "Descobrindo suas forças",
          description: "Identifique seus pontos fortes e como usá-los",
          type: "video",
          icon_type: "video",
          duration: 15,
          order_index: 0
        },
        {
          id: 2,
          module_id: 1,
          name: "Teste de personalidade",
          description: "Descubra mais sobre seu perfil",
          type: "quiz",
          icon_type: "quiz",
          duration: 10,
          order_index: 1
        },
        {
          id: 3,
          module_id: 1,
          name: "Diário de reflexão",
          description: "Pratique o autoconhecimento diariamente",
          type: "challenge",
          icon_type: "challenge",
          duration: 20,
          order_index: 2
        }
      ];
    }
    return [];
  } catch (error) {
    console.error(`Error fetching phases for module ${moduleId}:`, error);
    throw error;
  }
};

export const getPhaseById = async (id: number): Promise<Phase | null> => {
  try {
    // Mock implementation
    const moduleId = 1; // Hardcoded for now
    const phases = await getPhasesByModuleId(moduleId);
    return phases.find(p => p.id === id) || null;
  } catch (error) {
    console.error(`Error fetching phase with id ${id}:`, error);
    return null;
  }
};

export const createPhase = async (phase: Omit<Phase, "id" | "created_at" | "updated_at">): Promise<Phase> => {
  try {
    // Mock implementation - will be replaced with actual DB insert
    const phases = await getPhasesByModuleId(phase.module_id);
    const newId = phases.length > 0 ? Math.max(...phases.map(p => p.id)) + 1 : 1;
    
    const newPhase = {
      id: newId,
      ...phase,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Created phase:", newPhase);
    return newPhase;
  } catch (error) {
    console.error("Error creating phase:", error);
    throw error;
  }
};

export const updatePhase = async (id: number, phase: Partial<Omit<Phase, "id" | "created_at" | "updated_at">>): Promise<Phase> => {
  try {
    // Mock implementation - will be replaced with actual DB update
    const existingPhase = await getPhaseById(id);
    
    if (!existingPhase) {
      throw new Error(`Phase with id ${id} not found`);
    }
    
    const updatedPhase = {
      ...existingPhase,
      ...phase,
      updated_at: new Date().toISOString()
    };
    
    console.log("Updated phase:", updatedPhase);
    return updatedPhase;
  } catch (error) {
    console.error(`Error updating phase with id ${id}:`, error);
    throw error;
  }
};

export const deletePhase = async (id: number): Promise<void> => {
  try {
    // Mock implementation - will be replaced with actual DB delete
    console.log(`Deleted phase with id ${id}`);
  } catch (error) {
    console.error(`Error deleting phase with id ${id}:`, error);
    throw error;
  }
};

// Quizzes e Perguntas
export const getQuestionsByPhaseId = async (phaseId: number): Promise<Question[]> => {
  try {
    // Mock implementation
    if (phaseId === 2) {
      return [
        {
          id: 1,
          quiz_id: 1,
          question: "Qual desses é um traço de personalidade do Big Five?",
          options: ["Introspecção", "Abertura a experiências", "Perfeição", "Ansiedade"],
          correct_answer: 1,
          order_index: 0
        },
        {
          id: 2,
          quiz_id: 1,
          question: "Pessoas com alta extroversão geralmente:",
          options: ["Preferem ficar sozinhas", "Ganham energia em ambientes sociais", "São sempre organizadas", "Têm dificuldade em se comunicar"],
          correct_answer: 1,
          order_index: 1
        }
      ];
    }
    return [];
  } catch (error) {
    console.error(`Error fetching questions for phase ${phaseId}:`, error);
    throw error;
  }
};

export const saveQuiz = async (phaseId: number, questions: Omit<Question, "id" | "quiz_id">[]): Promise<void> => {
  try {
    // Mock implementation - will be replaced with actual DB operations
    console.log(`Saving quiz for phase ${phaseId} with ${questions.length} questions`);
  } catch (error) {
    console.error(`Error saving quiz for phase ${phaseId}:`, error);
    throw error;
  }
};
