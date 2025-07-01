// ARQUIVO: services/moduleService.ts (VERSÃO CORRIGIDA)

import { supabase } from "@/integrations/supabase/client";

// --- TIPOS ---
export type PhaseStatus = "notStarted" | "inProgress" | "completed";
export type ModuleType =
  | "autoconhecimento"
  | "comunicação"
  | "produtividade"
  | "carreira"
  | "habilidades"
  | "futuro";
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
  // CORREÇÃO: Adicionando os campos que faltavam ao tipo
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

// --- FUNÇÕES DE MÓDULOS ---
export const getModules = async (): Promise<Module[]> => {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select('*') // Busca todas as colunas
      .order("order_index", { ascending: true });

    if (error) {
        console.error("Error fetching modules:", error);
        throw error;
    }

    // Não precisamos mais do .map(). 
    // O 'data' retornado já contém TODOS os campos e está no formato correto.
    // Apenas retornamos o array de dados diretamente.
    return (data as Module[]) || []; 

  } catch (error) {
    console.error("Error in getModules function:", error);
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


// --- FUNÇÕES DE FASES ---
export const getPhasesByModuleId = async (
  moduleId: number,
): Promise<Phase[]> => {
  try {
    const { data, error } = await supabase
      .from("phases")
      .select(
        // CORREÇÃO: Adicionando 'quote' e 'quote_author' à string de seleção
        "id, created_at, module_id, name, description, type, duration, order_index, content, video_url, video_notes, quote, quote_author"
      )
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true });
    if (error) throw error;
    // O mapeamento não é necessário se os tipos já batem
    return (data as Phase[]) || [];
  } catch (error) {
    console.error("Error fetching phases by module id:", error);
    throw error;
  }
};

export const getPhaseById = async (id: number): Promise<Phase | null> => {
  try {
    const { data, error } = await supabase
      .from("phases")
      // CORREÇÃO: Usando '*' para garantir que todos os campos, incluindo os novos, sejam buscados
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Phase | null;
  } catch (error) {
    console.error("Error fetching phase by id:", error);
    throw error;
  }
};

export const createPhase = async (
  phase: Omit<Phase, "id" | "created_at">,
): Promise<Phase> => {
  try {
    const { data: createdPhase, error: phaseError } = await supabase
      .from("phases")
      .insert([phase])
      .select()
      .single();

    if (phaseError) {
      console.error("Erro ao criar a fase no banco de dados:", phaseError);
      throw phaseError;
    }
    if (!createdPhase) {
      throw new Error("Falha ao criar fase, nenhum dado retornado.");
    }

    if (createdPhase.type === 'quiz') {
      const { error: quizLinkError } = await supabase
        .from("quizzes")
        .insert({ phase_id: createdPhase.id });

      if (quizLinkError) {
        console.error( `ERRO CRÍTICO: A fase de quiz (ID: ${createdPhase.id}) foi criada, mas falhou ao criar a ligação na tabela 'quizzes'.`, quizLinkError);
        throw new Error(`A fase foi criada, mas a ligação do quiz falhou: ${quizLinkError.message}. Verifique as permissões (RLS) da tabela 'quizzes'.`);
      }
    }
    return createdPhase as Phase;
  } catch (error) {
    console.error("Erro geral na função createPhase:", error);
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


// --- FUNÇÕES DE QUIZ E PERGUNTAS ---
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
      if (typeof options === "string") { try { options = JSON.parse(options); } catch (e) { options = []; } }
      if (!Array.isArray(options) || options.length === 0) { options = ["", "", "", ""]; }
      return { ...question, options: options.map(opt => String(opt)), tips_question: question.tips_question, phase_id: phaseId };
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


// --- FUNÇÕES DE PROGRESSO DO USUÁRIO ---
export const getUserPhaseStatus = async ( userId: string, phaseId: number ): Promise<PhaseStatus> => { try { const { data, error } = await supabase.from("user_phases").select("status").eq("user_id", userId).eq("phase_id", phaseId).maybeSingle(); if (error && error.code !== "PGRST116") throw error; return (data?.status as PhaseStatus) || "notStarted"; } catch (error) { console.error("Error getting user phase status:", error); return "notStarted"; } };
export const updateUserPhaseStatus = async ( userId: string, phaseId: number, status: PhaseStatus ): Promise<void> => { try { const { error } = await supabase.from("user_phases").upsert({ user_id: userId, phase_id: phaseId, status: status, completed_at: status === "completed" ? new Date().toISOString() : null, }); if (error) throw error; } catch (error) { console.error("Critical error in updateUserPhaseStatus:", error); throw error; } };
export const getModuleProgress = async ( userId: string, moduleId: number ): Promise<number> => { try { const { count: totalPhases, error: totalError } = await supabase.from("phases").select("*", { count: "exact", head: true }).eq("module_id", moduleId); if (totalError) throw totalError; if (totalPhases === 0 || totalPhases === null) return 0; const { count: completedPhases, error: completedError } = await supabase.from("user_phases").select("*, phases!inner(module_id)", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed").eq("phases.module_id", moduleId); if (completedError) throw completedError; return Math.round(((completedPhases || 0) / totalPhases) * 100); } catch (error) { console.error("Error calculating module progress:", error); return 0; } };
export const isModuleCompleted = async ( userId: string, moduleId: number ): Promise<boolean> => { try { const { count: totalPhases, error: totalError } = await supabase.from("phases").select("*", { count: "exact", head: true }).eq("module_id", moduleId); if (totalError) throw totalError; if (totalPhases === 0 || totalPhases === null) return false; const { count: completedPhases, error: completedError } = await supabase.from("user_phases").select("*, phases!inner(module_id)", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed").eq("phases.module_id", moduleId); if (completedError) throw completedError; return (completedPhases || 0) === totalPhases; } catch (error) { console.error("Error checking module completion:", error); return false; } };
export const getUserNextPhase = async ( userId: string, moduleId: number ): Promise<Phase | null> => { try { const phases = await getPhasesByModuleId(moduleId); if (phases.length === 0) return null; const phaseIds = phases.map((p) => p.id); const { data: userPhases, error } = await supabase.from("user_phases").select("phase_id, status").eq("user_id", userId).in("phase_id", phaseIds); if (error) { throw error; } const completedPhaseIds = new Set((userPhases || []).filter((p) => p.status === "completed").map((p) => p.phase_id)); for (const phase of phases) { if (!completedPhaseIds.has(phase.id)) { return phase; } } return null; } catch (error) { console.error("Error getting next phase:", error); return null; } };
export const awardQuizXp = async ( userId: string, phaseId: number, xpAmount: number ): Promise<boolean> => { try { const { data: existingLog, error } = await supabase.from("xp_history").select("id").eq("user_id", userId).eq("source", "QUIZ_TIME_BONUS").eq("source_id", phaseId.toString()).maybeSingle(); if (error) throw error; if (existingLog) return false; const { error: insertError } = await supabase.from("xp_history").insert({ user_id: userId, xp_amount: xpAmount, source: "QUIZ_TIME_BONUS", source_id: phaseId.toString(), }); if (insertError) throw insertError; return true; } catch (error) { console.error("Erro ao conceder XP do quiz:", error); return false; } };
export const completePhase = async ( userId: string, phaseId: number ): Promise<void> => { try { await updateUserPhaseStatus(userId, phaseId, "completed"); } catch (error) { console.error("Error completing phase:", error); throw error; } };
export const completePhaseAndAwardXp = async (
  userId: string, 
  phaseId: number, 
  moduleId: number, 
  isQuiz: boolean = false
): Promise<{ xpFromPhase: number; xpFromModule: number; moduleCompleted: boolean }> => {
  console.log('🚀 completePhaseAndAwardXp chamado:', { userId, phaseId, moduleId, isQuiz });

  try {
    // Chamar a função RPC do Supabase
    const { data, error } = await supabase.rpc('complete_phase_and_award_xp_atomic', {
      p_user_id: userId,
      p_phase_id: phaseId,
      p_module_id: moduleId,
      p_is_quiz: isQuiz
    });

    if (error) {
      console.error('❌ Erro na RPC complete_phase_and_award_xp:', error);
      throw error;
    }

    console.log('📊 Dados retornados da RPC:', data);

    // Verificar se temos dados válidos
    if (!data || data.length === 0) {
      console.warn('⚠️ Nenhum dado retornado da RPC');
      return { xpFromPhase: 0, xpFromModule: 0, moduleCompleted: false };
    }

    // A RPC retorna um array com um objeto contendo os campos
    const result = data[0];
    console.log('📋 Resultado processado:', result);

    // Verificar os nomes das colunas retornadas
    // Possíveis nomes: v_xp_from_phase, xp_from_phase, etc.
    const xpFromPhase = result.xp_ganho_fase || 0;
    const xpFromModule = result.xp_ganho_modulo || 0;
    const moduleCompleted = result.modulo_concluido || false; // <<< INCLUSÃO DA LÓGICA AQUI

    console.log('✅ XP calculado:', { xpFromPhase, xpFromModule, moduleCompleted });

    return {
      xpFromPhase: Number(xpFromPhase) || 0,
      xpFromModule: Number(xpFromModule) || 0,
      moduleCompleted: Boolean(moduleCompleted) // <<< E AQUI
    };

  } catch (error) {
    console.error('❌ Erro em completePhaseAndAwardXp:', error);
    throw error;
  }
};

// Função alternativa caso a RPC não esteja funcionando corretamente
export const completePhaseAndAwardXpAlternative = async (
  userId: string, 
  phaseId: number, 
  moduleId: number, 
  isQuiz: boolean = false
): Promise<{ xpFromPhase: number; xpFromModule: number; moduleCompleted: boolean }> => {
  console.log('🔄 Usando método alternativo para XP');

  let xpFromPhase = 0;
  let xpFromModule = 0;

  try {
    // 1. Marcar fase como completa
    const { error: phaseError } = await supabase
      .from('user_phases')
      .upsert({
        user_id: userId,
        phase_id: phaseId,
        status: 'completed',
        completed_at: new Date().toISOString()
      });

    if (phaseError) {
      console.error('Erro ao completar fase:', phaseError);
      throw phaseError;
    }

    // 2. Dar XP da fase (se não for quiz)
    if (!isQuiz) {
      // Verificar se já foi dado XP para esta fase
      const { data: existingXp } = await supabase
        .from('xp_history')
        .select('id')
        .eq('user_id', userId)
        .eq('source', 'PHASE_COMPLETION')
        .eq('source_id', phaseId.toString())
        .maybeSingle();

      if (!existingXp) {
        const { error: xpError } = await supabase
          .from('xp_history')
          .insert({
            user_id: userId,
            xp_amount: 5,
            source: 'PHASE_COMPLETION',
            source_id: phaseId.toString()
          });

        if (!xpError) {
          xpFromPhase = 5;
        }
      }
    }

    // 3. Verificar se módulo foi completado
    const { data: totalPhasesResult, error: totalPhasesError } = await supabase
      .from('phases')
      .select('id', { count: 'exact' })
      .eq('module_id', moduleId);

    if(totalPhasesError) throw totalPhasesError;

    const totalPhasesCount = totalPhasesResult?.length || 0;

    const { data: completedPhasesResult, error: completedPhasesError } = await supabase
      .from('user_phases')
      .select('phase_id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('phase_id', totalPhasesResult?.map(p => p.id) || []);

    if(completedPhasesError) throw completedPhasesError;

    const completedPhasesCount = completedPhasesResult?.length || 0;

    const moduleCompleted = totalPhasesCount > 0 && completedPhasesCount === totalPhasesCount;

    // 4. Dar XP do módulo se foi completado
    if (moduleCompleted) {
      const { data: existingModuleXp } = await supabase
        .from('xp_history')
        .select('id')
        .eq('user_id', userId)
        .eq('source', 'MODULE_COMPLETION')
        .eq('source_id', moduleId.toString())
        .maybeSingle();

      if (!existingModuleXp) {
        const { error: moduleXpError } = await supabase
          .from('xp_history')
          .insert({
            user_id: userId,
            xp_amount: 15,
            source: 'MODULE_COMPLETION',
            source_id: moduleId.toString()
          });

        if (!moduleXpError) {
          xpFromModule = 15;
        }
      }
    }

    // 5. Atualizar XP total no perfil (Esta parte parece redundante se você tiver o trigger, mas mantendo como no original)
    if (xpFromPhase > 0 || xpFromModule > 0) {
      const totalNewXp = xpFromPhase + xpFromModule;

      const { error: profileError } = await supabase.rpc('complete_phase_and_award_xp_atomic', {
        user_id: userId,
        xp_amount: totalNewXp
      });

      if (profileError) {
        console.error('Erro ao atualizar XP do perfil:', profileError);
      }
    }

    console.log('✅ XP alternativo calculado:', { xpFromPhase, xpFromModule, moduleCompleted });
    return { xpFromPhase, xpFromModule, moduleCompleted }; // <<< INCLUSÃO DA LÓGICA AQUI

  } catch (error) {
    console.error('❌ Erro no método alternativo:', error);
    throw error;
  }
};

// Função para debug - verificar estado atual do XP
export const debugXpState = async (userId: string, phaseId: number, moduleId: number) => {
  try {
    console.log('🔍 Debug XP State para:', { userId, phaseId, moduleId });

    // Verificar histórico de XP
    const { data: xpHistory } = await supabase
      .from('xp_history')
      .select('*')
      .eq('user_id', userId)
      .in('source_id', [phaseId.toString(), moduleId.toString()]);

    console.log('📊 Histórico de XP:', xpHistory);

    // Verificar status das fases
    const { data: userPhases } = await supabase
      .from('user_phases')
      .select('*')
      .eq('user_id', userId)
      .eq('phase_id', phaseId);

    console.log('📋 Status da fase:', userPhases);

    // Verificar XP total do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', userId)
      .single();

    console.log('👤 XP total do usuário:', profile?.xp);

    return {
      xpHistory,
      userPhases,
      totalXp: profile?.xp
    };
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return null;
  }
};