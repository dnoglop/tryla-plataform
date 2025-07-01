// =========================================================================================
// ARQUIVO: src/services/geminiService.ts (VERSÃO COM DEBUG E PROMPT REFORÇADO)
// =========================================================================================

import { supabase } from "@/integrations/supabase/client";

export interface MicroAction {
  description: string;
  duration: number;
  xp: number;
  type: 'review' | 'practice' | 'organize' | 'create' | 'exam';
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  tips: string[];
}

export async function generateMicroActions(
  mainTask: string,
  difficulty: "Fácil" | "Médio" | "Difícil",
): Promise<MicroAction[]> {

  // ATUALIZADO: Prompt reforçado para enfatizar a obrigatoriedade dos campos.
  const prompt = `
    Você é um coach de produtividade especialista em combater a procrastinação para estudantes.
    Sua missão é quebrar a seguinte tarefa em 4 a 5 micro-ações.

    Tarefa do usuário: "${mainTask}"
    Sentimento do usuário sobre a tarefa: "${difficulty}"

    REGRAS CRÍTICAS E OBRIGATÓRIAS:
    1. Sua resposta DEVE SER ESTRITAMENTE um array JSON válido. NÃO inclua NENHUM TEXTO, explicação, ou marcadores de código como \`\`\`json. APENAS o array JSON puro.
    2. CADA objeto no array JSON DEVE OBRIGATORIAMENTE conter TODOS os seguintes campos:
      - "description": string (clara, objetiva, começando com um verbo).
      - "duration": number (duração em minutos).
      - "xp": number (pontos de experiência, entre 10 e 50).
      - "type": string (um dos seguintes: 'review', 'practice', 'organize', 'create', 'exam').
      - "difficulty": string (um dos seguintes: 'Fácil', 'Médio', 'Difícil').
      - "tips": array com EXATAMENTE 2 strings (duas dicas curtas e práticas).

    Exemplo de formato PERFEITO da resposta:
    [
      {
        "description": "Revisar o conteúdo da primeira aula de cálculo",
        "duration": 15,
        "xp": 20,
        "type": "review",
        "difficulty": "Fácil",
        "tips": ["Use a técnica Pomodoro de 15 min.", "Crie um mapa mental dos conceitos."]
      }
    ]
  `;

  try {
    const { data, error } = await supabase.functions.invoke('generate-plan', {
      body: { prompt },
    });

    if (error) throw new Error(`Erro ao invocar a Edge Function: ${error.message}`);
    if (data.error) throw new Error(`Erro retornado pela IA: ${data.error}`);

    let jsonString = data.plan;
    const match = jsonString.match(/```(json\s*)?([\s\S]*?)```/);
    if (match && match[2]) {
      jsonString = match[2].trim();
    }

    // ====================================================================
    // >> ADIÇÃO DO LOG DE DEPURAÇÃO <<
    // Vamos imprimir no console a resposta da IA *depois* de ser limpa,
    // mas *antes* de tentar o parse. Isso nos mostrará o que está errado.
    console.log("Resposta da IA (string limpa) antes do parse:", jsonString);
    // ====================================================================

    const parsedData: MicroAction[] = JSON.parse(jsonString);

    // Validação robusta (mantida)
    if (
      !Array.isArray(parsedData) ||
      parsedData.some(item => 
        !item.description || 
        typeof item.duration !== 'number' ||
        typeof item.xp !== 'number' ||
        !item.type ||
        !item.difficulty ||
        !Array.isArray(item.tips)
      )
    ) {
      // Se o erro acontecer de novo, o log acima nos dirá o porquê.
      throw new Error("Dados inválidos ou faltando campos recebidos da IA.");
    }

    return parsedData;

  } catch (error) {
    console.error("Erro ao gerar plano com IA:", error);
    // Plano de fallback (mantido)
    return [
      { description: "Organizar seu espaço de trabalho", duration: 5, xp: 10, type: 'organize', difficulty: 'Fácil', tips: ["Um ambiente limpo ajuda a focar.", "Coloque uma música relaxante."] },
      { description: "Trabalhar no primeiro passo por 15 minutos", duration: 15, xp: 25, type: 'practice', difficulty: 'Médio', tips: ["Use um timer visível.", "Desligue as notificações do celular."] },
      { description: "Fazer uma pausa de 5 minutos", duration: 5, xp: 5, type: 'review', difficulty: 'Fácil', tips: ["Alongue o corpo.", "Beba um copo de água."] },
    ];
  }
}