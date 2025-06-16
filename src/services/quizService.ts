// ARQUIVO: services/quizService.ts (VERSÃO COMPLETA - SEM ALTERAÇÕES)

import { supabase } from "@/integrations/supabase/client";

// --- TIPOS ---

export interface Quiz {
  id: number; // ID da tabela 'quizzes'
  phase_id: number; // ID da tabela 'phases'
  name: string; // Vem da tabela 'phases'
  description?: string; // Vem da tabela 'phases'
  created_at: string;
}

export interface Question {
  id: number;
  quiz_id: number; // ID da tabela 'quizzes'
  question: string;
  options: string[];
  correct_answer: number;
  order_index: number;
  tips_question?: string;
  created_at: string;
}

// --- FUNÇÕES PARA QUIZZES ---

export async function getQuizzes(): Promise<Quiz[]> {
  try {
    const { data, error } = await supabase
      .from("quizzes")
      .select(`
        id,
        phase_id,
        created_at,
        phases (
          name,
          description
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data?.map(item => ({
      id: item.id,
      phase_id: item.phase_id,
      name: (item.phases as any)?.name || 'Nome não encontrado',
      description: (item.phases as any)?.description || '',
      created_at: item.created_at,
    })) || [];
  } catch (error) {
    console.error("Erro ao buscar quizzes:", error);
    throw new Error("Não foi possível carregar os quizzes.");
  }
}

export async function updateQuiz(phaseId: number, quizData: { name: string, description?: string }): Promise<void> {
    const { error } = await supabase
        .from("phases")
        .update({
            name: quizData.name,
            description: quizData.description,
        })
        .eq("id", phaseId);

    if (error) {
      console.error("Erro ao atualizar fase do quiz:", error);
      throw new Error(`Erro ao atualizar fase do quiz: ${error.message}`);
    }
}

export async function deleteQuiz(quizId: number, phaseId: number): Promise<void> {
  try {
    const { error: questionsError } = await supabase.from("questions").delete().eq("quiz_id", quizId);
    if (questionsError) throw new Error(`Erro ao deletar perguntas: ${questionsError.message}`);
    
    const { error: quizLinkError } = await supabase.from("quizzes").delete().eq("id", quizId);
    if (quizLinkError) throw new Error(`Erro ao deletar ligação do quiz: ${quizLinkError.message}`);

    const { error: phaseError } = await supabase.from("phases").delete().eq("id", phaseId);
    if (phaseError) throw new Error(`Erro ao deletar fase do quiz: ${phaseError.message}`);
  } catch (error) {
    console.error("Erro ao deletar quiz:", error);
    throw error;
  }
}


// --- FUNÇÕES PARA PERGUNTAS ---

export async function getQuestionsByQuizId(quizId: number): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("order_index", { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar perguntas do quiz:", error);
    throw new Error("Não foi possível carregar as perguntas.");
  }
}

export async function createQuestion(questionData: Omit<Question, "id" | "created_at">): Promise<Question> {
  const { data, error } = await supabase.from("questions").insert(questionData).select().single();
  if (error) {
    console.error("Erro ao criar pergunta:", error);
    throw new Error(`Erro ao criar pergunta: ${error.message}`);
  }
  return data;
}

export async function updateQuestion(id: number, questionData: Partial<Question>): Promise<Question> {
  const { data, error } = await supabase.from("questions").update(questionData).eq("id", id).select().single();
  if (error) {
    console.error("Erro ao atualizar pergunta:", error);
    throw new Error(`Erro ao atualizar pergunta: ${error.message}`);
  }
  return data;
}

export async function deleteQuestion(id: number): Promise<void> {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) {
    console.error("Erro ao deletar pergunta:", error);
    throw new Error(`Erro ao deletar pergunta: ${error.message}`);
  }
}