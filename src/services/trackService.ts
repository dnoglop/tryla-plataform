// src/services/trackService.ts

import { supabase } from "@/integrations/supabase/client";
import { getModules } from "./moduleService";

// ===================================================================
// TIPAGENS (INTERFACES) ATUALIZADAS
// ===================================================================

/**
 * Define a estrutura completa dos dados coletados do novo formulário de onboarding.
 */
export interface UserOnboardingData {
  full_name: string;
  birth_date: string;
  gender: string;
  city: string;
  state: string;
  // Perguntas abertas mantidas e renomeadas
  career_goal: string;
  current_challenge: string;
  hobbies: string;
  // Novas perguntas estruturadas
  development_areas: string[];
  interests: string[];
  learning_style: string;
  weekly_time: string;
  experience_level: string;
}

/**
 * Define a estrutura do objeto JSON que esperamos receber da IA.
 */
interface AITrackResponse {
  recommended_module_ids: number[];
  justification_text: string;
}


// ===================================================================
// FUNÇÕES EXPORTADAS
// ===================================================================

/**
 * Orquestra a geração da trilha personalizada com base no novo e rico conjunto de dados do usuário.
 */
export async function generatePersonalizedTrack(userData: UserOnboardingData): Promise<AITrackResponse> {
  const allModules = await getModules();
  const firstName = userData.full_name.split(' ')[0];
  const userAge = calculateAge(userData.birth_date);

  const modulesForAI = allModules.map(module => ({
    id: module.id,
    name: module.name,
    description: module.description,
    tags: module.tags,
    objective: module.objective,
  }));

  // Monta o NOVO PROMPT DETALHADO para o Gemini, incluindo todos os novos campos.
  const prompt = `
    **Tarefa:** Você é um mentor de carreira e desenvolvimento pessoal para jovens de 16-24 anos chamado Tryla. Sua missão é criar uma trilha de aprendizado personalizada, motivadora e empática.

    **Contexto:** Você está analisando as respostas de um novo usuário em seu formulário de onboarding.

    **Dados do Usuário (${firstName}):**
    - Idade: ${userAge} anos
    - Gênero: ${userData.gender || 'Não informado'}
    - Localização: ${userData.city || 'Não informada'}, ${userData.state || 'Não informado'}

    **Respostas Abertas (O Coração do Perfil):**
    - Sonho de Carreira: "${userData.career_goal}"
    - Maior Desafio Hoje: "${userData.current_challenge}"
    - Hobbies e Paixões: "${userData.hobbies}"

    **Preferências e Perfil (Respostas de Múltipla Escolha):**
    - Áreas que quer desenvolver: ${userData.development_areas.join(", ")}
    - Nível de experiência em autodesenvolvimento: ${userData.experience_level}
    - Tempo disponível por semana: ${userData.weekly_time}
    - Principais Interesses: ${userData.interests.join(", ")}
    - Estilo de aprendizado preferido: ${userData.learning_style}

    **Lista de Módulos Disponíveis (em formato JSON):**
    ${JSON.stringify(modulesForAI, null, 2)}

    **Instruções Precisas:**
    1.  **Análise Profunda:** Analise TODOS os dados de ${firstName}. Conecte os desafios e sonhos dele(a) com os objetivos dos módulos. A idade é um fator crucial.
    2.  **Seleção Estratégica:** Selecione EXATAMENTE 4 ou 5 módulos da lista. A ordem deve criar uma progressão lógica, começando pelos fundamentos (ex: autoconhecimento, organização) antes de avançar para temas mais complexos.
    3.  **Justificativa em Markdown:** Crie um texto de boas-vindas. O tom deve ser encorajador, como um mentor conversando com ${firstName}. Use **ESTRITAMENTE** esta formatação:
        - Saudação pessoal (Ex: "Olá, ${firstName}! Que demais ter você aqui. Analisei suas respostas e preparei algo especial...").
        - Para cada módulo recomendado, use: "### [NOME DO MÓDULO EM MAIÚSCULAS]" seguido por um parágrafo explicando POR QUE aquele módulo é perfeito para os objetivos e desafios de ${firstName}.
        - Finalize com um parágrafo de encerramento motivacional.
    4.  **Resposta Final em JSON:** Sua resposta final deve ser **APENAS UM OBJETO JSON VÁLIDO**, sem nenhum texto ou formatação fora do JSON. A estrutura é:
        {
          "recommended_module_ids": [array_de_IDs_dos_modulos_selecionados],
          "justification_text": "seu_texto_de_justificativa_aqui"
        }
  `;

  try {
    const { data, error } = await supabase.functions.invoke('call-gemini', { body: { prompt } });
    if (error) throw new Error(`Erro na Edge Function: ${error.message}`);
    if (data.error) throw new Error(`Erro na API da IA: ${data.error}`);

    const rawAiResponseText = extractTextFromGeminiResponse(data);
    const jsonString = rawAiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedResponse: AITrackResponse = JSON.parse(jsonString);

    if (!parsedResponse.recommended_module_ids || !parsedResponse.justification_text) {
      throw new Error("Resposta da IA mal formatada.");
    }
    return parsedResponse;
  } catch (err) {
    console.error("Falha crítica no serviço de geração de trilha:", err);
    throw err;
  }
}

/**
 * Salva a trilha gerada E as novas respostas do onboarding no banco de dados.
 */
export async function saveUserTrack(userId: string, trackData: AITrackResponse, originalUserData: UserOnboardingData) {
    const { error: trackError } = await supabase.from('user_tracks').insert({
        user_id: userId,
        module_ids: trackData.recommended_module_ids,
        ai_justification: trackData.justification_text,
        status: 'not_started',
        // SALVANDO TODOS OS DADOS COLETADOS
        career_goal: originalUserData.career_goal,
        current_challenge: originalUserData.current_challenge,
        hobbies: originalUserData.hobbies,
        development_areas: originalUserData.development_areas,
        interests: originalUserData.interests,
        learning_style: originalUserData.learning_style,
        weekly_time: originalUserData.weekly_time,
        experience_level: originalUserData.experience_level,
    });

    if (trackError) {
        console.error("Erro ao salvar a trilha do usuário:", trackError);
        throw trackError;
    }

    const { error: onboardingError } = await supabase
        .from('user_onboarding')
        .upsert({
            user_id: userId,
            completed_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (onboardingError) {
        console.warn("Aviso: Falha ao registrar a conclusão do onboarding.", onboardingError);
    }

    return true;
}

// ===================================================================
// FUNÇÕES HELPER (USADAS APENAS DENTRO DESTE ARQUIVO)
// ===================================================================

function extractTextFromGeminiResponse(response: any): string {
  try {
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("O texto não foi encontrado na estrutura da resposta da IA.");
    return text;
  } catch (error) {
    console.error("Erro crítico ao extrair texto da resposta do Gemini:", error);
    return "Não foi possível processar a resposta da IA. Tente novamente.";
  }
}

function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  try {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDifference = today.getMonth() - birthDateObj.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age > 0 ? age : 0;
  } catch (error) {
    return 0;
  }
}