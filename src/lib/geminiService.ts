import { supabase } from "@/integrations/supabase/client";

// Tipagem para os scores RIASEC
type Scores = Record<"R" | "I" | "A" | "S" | "E" | "C", number>;

// Função HELPER para extrair o texto da resposta complexa do Gemini
function extractTextFromGeminiResponse(response: any): string {
  try {
    // Navega pela estrutura da resposta para encontrar o texto
    return response.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Erro ao extrair texto da resposta do Gemini:", error);
    return "Não foi possível processar a resposta da IA. Tente novamente.";
  }
}

/**
 * Monta o prompt e chama a Edge Function segura para obter a análise final da IA.
 * @param scores Os scores RIASEC do usuário.
 *-  * @param hobbies Os hobbies informados pelo usuário.
 * @returns A análise em formato de texto.
 */
export async function getFinalAIAnalysis(scores: Scores, hobbies: string): Promise<string> {
  // 1. Monta um prompt detalhado para a IA
  const prompt = `
    Analise o seguinte perfil vocacional e forneça um resultado encorajador e prático em formato Markdown.

    **Perfil do Usuário:**
    - **Pontuação RIASEC (Realista, Investigativo, Artístico, Social, Empreendedor, Convencional):**
      - Realista (R): ${scores.R}
      - Investigativo (I): ${scores.I}
      - Artístico (A): ${scores.A}
      - Social (S): ${scores.S}
      - Empreendedor (E): ${scores.E}
      - Convencional (C): ${scores.C}
    - **Hobbies e Interesses:** ${hobbies}

    **Sua Tarefa:**
    1.  Identifique os 2 ou 3 tipos RIASEC com maior pontuação.
    2.  Com base nesses tipos e nos hobbies, escreva uma análise de perfil de 2 parágrafos.
    3.  Sugira 3 a 5 profissões ou áreas de estudo que combinem com o perfil. Liste-as com bullet points.
    4.  Finalize com uma frase motivacional.
    
    Use um tom amigável, como um melhor amigo e inspirador.
    Sempre apresente justificativa para a profissão escolhida ser boa para a pessoa.
    Formate a resposta usando Markdown com títulos e negrito.
  `;

  // 2. Chama a Edge Function 'call-gemini' de forma segura
  try {
    const { data, error } = await supabase.functions.invoke('call-gemini', {
      body: { prompt },
    });

    if (error) {
      // Captura erros de rede ou da própria função
      throw new Error(`Erro na Edge Function: ${error.message}`);
    }

    if (data.error) {
      // Captura erros lógicos retornados pela função (ex: chave de API faltando no servidor)
      throw new Error(`Erro retornado pela IA: ${data.error}`);
    }

    // 3. Extrai o texto da resposta e retorna
    return extractTextFromGeminiResponse(data);
    
  } catch (error) {
    console.error("Falha ao chamar o serviço da IA:", error);
    // Retorna uma mensagem de erro amigável para o usuário
    return "## Ops! Tivemos um problema\n\nNão consegui me conectar ao Oráculo para analisar seu resultado. Por favor, tente novamente em alguns instantes.";
  }
}