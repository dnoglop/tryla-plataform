import { supabase } from "@/integrations/supabase/client";

// --- TIPOS ---

// Este tipo agora reflete a estrutura combinada que vamos buscar.
export interface Quiz {
  id: number; // Este é o ID da tabela 'quizzes'
  phase_id: number; // Este é o ID da tabela 'phases'
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

// --- FUNÇÕES PARA QUIZZES (ATUALIZADAS) ---

export async function getQuizzes(): Promise<Quiz[]> {
  // MUDANÇA CRÍTICA: Usamos um JOIN para buscar os dados corretamente.
  // Selecionamos o ID da tabela 'quizzes' (para linkar com as perguntas)
  // e o nome/descrição da tabela 'phases'.
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

  if (error) throw new Error(error.message);

  // Mapeamos os dados para a estrutura do tipo 'Quiz' que definimos.
  return data?.map(item => ({
    id: item.id,
    phase_id: item.phase_id,
    name: (item.phases as any)?.name || 'Nome não encontrado',
    description: (item.phases as any)?.description || '',
    created_at: item.created_at,
  })) || [];
}

// A criação agora é um processo de 2 passos.
export async function createQuiz(quizData: { name: string, description?: string }): Promise<Quiz> {
  // Passo 1: Criar a 'phase' com o tipo 'quiz'.
  const { data: phaseData, error: phaseError } = await supabase
    .from("phases")
    .insert({
      name: quizData.name,
      description: quizData.description,
      type: 'quiz', // Tipo fixo para ser um quiz
      // Você pode adicionar valores padrão para outras colunas obrigatórias aqui
      icon_type: 'quiz',
      duration: 0,
      order_index: 0,
    })
    .select()
    .single();

  if (phaseError) throw new Error(`Erro ao criar fase: ${phaseError.message}`);
  if (!phaseData) throw new Error("Falha ao criar fase, nenhum dado retornado.");

  // Passo 2: Criar a entrada na tabela 'quizzes' ligando à fase criada.
  const { data: quizLinkData, error: quizLinkError } = await supabase
    .from("quizzes")
    .insert({ phase_id: phaseData.id })
    .select()
    .single();

  if (quizLinkError) throw new Error(`Erro ao ligar quiz à fase: ${quizLinkError.message}`);
  
  // Retorna um objeto combinado, como se fosse um único quiz.
  return {
    id: quizLinkData.id,
    phase_id: phaseData.id,
    name: phaseData.name,
    description: phaseData.description,
    created_at: quizLinkData.created_at,
  };
}

// A atualização edita a 'phase' correspondente.
export async function updateQuiz(phaseId: number, quizData: { name: string, description?: string }): Promise<void> {
    const { error } = await supabase
        .from("phases")
        .update({
            name: quizData.name,
            description: quizData.description,
        })
        .eq("id", phaseId);

    if (error) throw new Error(`Erro ao atualizar fase do quiz: ${error.message}`);
}


// A exclusão agora precisa deletar de 3 tabelas (ou usar ON DELETE CASCADE no DB).
export async function deleteQuiz(quizId: number, phaseId: number): Promise<void> {
  // Passo 1: Deletar todas as perguntas associadas ao 'quiz_id'.
  const { error: questionsError } = await supabase.from("questions").delete().eq("quiz_id", quizId);
  if (questionsError) throw new Error(`Erro ao deletar perguntas: ${questionsError.message}`);
  
  // Passo 2: Deletar a entrada de ligação na tabela 'quizzes'.
  const { error: quizLinkError } = await supabase.from("quizzes").delete().eq("id", quizId);
  if (quizLinkError) throw new Error(`Erro ao deletar ligação do quiz: ${quizLinkError.message}`);

  // Passo 3: Deletar a fase original.
  const { error: phaseError } = await supabase.from("phases").delete().eq("id", phaseId);
  if (phaseError) throw new Error(`Erro ao deletar fase do quiz: ${phaseError.message}`);
}

// --- FUNÇÕES PARA PERGUNTAS (SEM ALTERAÇÕES) ---

export async function getQuestionsByQuizId(quizId: number): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("order_index", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createQuestion(questionData: Omit<Question, "id" | "created_at">): Promise<Question> {
  const { data, error } = await supabase.from("questions").insert(questionData).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateQuestion(id: number, questionData: Partial<Question>): Promise<Question> {
  const { data, error } = await supabase.from("questions").update(questionData).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteQuestion(id: number): Promise<void> {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}