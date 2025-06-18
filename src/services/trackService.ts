import { supabase } from "@/integrations/supabase/client";
import { getModules } from "./moduleService"; // Reutiliza sua função existente de buscar módulos

// ===================================================================
// TIPAGENS (INTERFACES)
// ===================================================================

/**
 * Define a estrutura dos dados coletados do usuário durante o onboarding.
 * Esses dados serão usados para alimentar o prompt da IA.
 */
interface UserOnboardingData {
  academicGoals: string;
  professionalGoals: string;
  challenges: string;
  hobbies: string;
  birth_date: string;
  gender: string;
  city: string;
  state: string;
  full_name: string;
}

/**
 * Define a estrutura do objeto JSON que esperamos receber da IA.
 * Ter uma tipagem garante que possamos processar a resposta de forma segura.
 */
interface AITrackResponse {
  recommended_module_ids: number[];
  justification_text: string;
}


// ===================================================================
// FUNÇÕES EXPORTADAS (USADAS POR OUTRAS PARTES DO APP)
// ===================================================================

/**
 * Orquestra a geração da trilha personalizada.
 * 1. Busca todos os módulos disponíveis.
 * 2. Constrói um prompt detalhado com os dados do usuário e dos módulos.
 * 3. Chama a Edge Function 'call-gemini' para obter a análise da IA.
 * 4. Processa e valida a resposta JSON da IA.
 * @param {UserOnboardingData} userData - Os dados do formulário de onboarding do usuário.
 * @returns {Promise<AITrackResponse>} A trilha gerada e a justificativa da IA.
 */
export async function generatePersonalizedTrack(userData: UserOnboardingData): Promise<AITrackResponse> {
  // 1. Obter todos os módulos disponíveis do banco de dados.
  const allModules = await getModules();

  const firstName = userData.full_name.split(' ')[0];
  
  // 2. Formatar os dados dos módulos para a IA (enviar apenas o essencial).
  // A qualidade dos dados aqui (especialmente tags e objetivos) é crucial para um bom resultado.
  const modulesForAI = allModules.map(module => ({
    id: module.id,
    name: module.name,
    description: module.description,
    tags: module.tags,
    objective: module.objective,
    problem_statements: module.problem_statements
  }));

  // 3. Calcular a idade do usuário para dar mais contexto à IA.
  const userAge = calculateAge(userData.birth_date);

  // 4. Montar o PROMPT DETALHADO E PRECISO para o Gemini.
  const prompt = `
    **Tarefa:** Você é um mentor de carreira e desenvolvimento pessoal para jovens de 16-24 anos. Sua missão é criar uma trilha de aprendizado personalizada e motivadora.

    **Contexto:** Você tem acesso a uma lista de módulos de aprendizado e às respostas de um novo usuário em seu formulário de onboarding.

    **Dados do Usuário:**
    - Idade: ${userAge} anos
    - Gênero: ${userData.gender || 'Não informado'}
    - Localização: ${userData.city || 'Não informada'}, ${userData.state || 'Não informado'}
    - Metas Acadêmicas: "${userData.academicGoals}"
    - Metas Profissionais: "${userData.professionalGoals}"
    - Maiores Desafios Atuais: "${userData.challenges}"
    - Hobbies e Interesses: "${userData.hobbies}"

    **Lista de Módulos Disponíveis (em formato JSON):**
    ${JSON.stringify(modulesForAI, null, 2)}

    **Instruções Precisas:**
    1.  Analise profundamente **TODOS** os dados de ${firstName}. Conecte seus desafios, metas e hobbies com os objetivos e problemas que cada módulo se propõe a resolver.
    2.  Selecione EXATAMENTE 4 ou 5 módulos da lista que melhor se encaixam no perfil e nas necessidades atuais do usuário. A ordem de seleção é importante, comece pelo mais fundamental.
    3.  Crie um texto de justificativa. O tom deve ser encorajador, pessoal e direto. **Use formatação Markdown para melhorar a legibilidade:**
        - Comece com uma saudação pessoal para a ${firstName} e uma introdução de um parágrafo.
        - Apresente cada módulo recomendado como um item de lista (usando '- ' ou '* ').
        - Pule uma linha quando começar um novo parágrafo.
        - Em cada item da lista, coloque o nome do módulo em **negrito** e explique brevemente (1 frase) por que ele foi escolhido, conectando com os dados do usuário.
        - Finalize com um parágrafo de encerramento motivacional.
    4.  **FORMATE SUA RESPOSTA FINAL ESTRITAMENTE COMO UM OBJETO JSON VÁLIDO, sem nenhum texto, markdown ou formatação adicional antes ou depois do JSON.** O JSON deve ter a seguinte estrutura:
        {
          "recommended_module_ids": [array_de_numeros_com_os_IDs_dos_modulos_selecionados],
          "justification_text": "seu_texto_de_justificativa_aqui"
        }
  `;

  // 5. Chamar a Edge Function 'call-gemini' de forma segura.
  try {
    const { data, error } = await supabase.functions.invoke('call-gemini', {
      body: { prompt },
    });

    if (error) {
      throw new Error(`Erro de rede ou da Edge Function: ${error.message}`);
    }
    if (data.error) {
      throw new Error(`Erro retornado pela API da IA: ${data.error}`);
    }

    // 6. Extrair o texto bruto da resposta da IA.
    const rawAiResponseText = extractTextFromGeminiResponse(data);
    console.log("Resposta Bruta da IA:", rawAiResponseText); // Ótimo para debug!

    // 7. LIMPAR a resposta para extrair APENAS o objeto JSON.
    // Isso remove os blocos de código "```json" e "```" e outros espaços.
    const jsonString = rawAiResponseText
    .replace(/```json/g, '') // Remove o marcador de início do bloco de código
    .replace(/```/g, '')     // Remove o marcador de fim do bloco de código
    .trim();                 // Remove espaços em branco no início e no fim

    // 8. Tentar fazer o parse da string JSON limpa.
    const parsedResponse: AITrackResponse = JSON.parse(jsonString);

    // 9. Validar a estrutura da resposta para garantir que ela contém os campos necessários.
    if (!parsedResponse.recommended_module_ids || !parsedResponse.justification_text) {
      console.error("Resposta da IA está mal formatada:", parsedResponse);
      throw new Error("A resposta da IA não continha os dados esperados.");
    }

    // 9. Se tudo deu certo, retorna os dados processados.
    return parsedResponse;

  } catch (err) {
    console.error("Falha crítica no serviço de geração de trilha:", err);
    // Propaga o erro para o `useMutation` no frontend poder tratar (ex: mostrar um toast de erro).
    throw err; 
  }
}


/**
 * Salva a trilha gerada pela IA no banco de dados na tabela 'user_tracks'.
 * @param {string} userId - O ID do usuário autenticado.
 * @param {AITrackResponse} trackData - O objeto contendo os IDs dos módulos e a justificativa.
 */
export async function saveUserTrack(userId: string, trackData: AITrackResponse, originalUserData: UserOnboardingData) {
    // Passo 1: Inserir a trilha na tabela user_tracks
    const { error: trackError } = await supabase.from('user_tracks').insert({
        user_id: userId,
        module_ids: trackData.recommended_module_ids,
        ai_justification: trackData.justification_text,
        status: 'not_started',
        // PREENCHENDO AS NOVAS COLUNAS
        academic_goals: originalUserData.academicGoals,
        professional_goals: originalUserData.professionalGoals,
        challenges: originalUserData.challenges,
        hobbies: originalUserData.hobbies,
    });

    if (trackError) {
        console.error("Erro ao salvar a trilha do usuário:", trackError);
        throw trackError;
    }

    // ===================================================================
    // PASSO 2 (A CORREÇÃO): Inserir um registro na tabela user_onboarding
    // para sinalizar que o processo foi concluído.
    // ===================================================================
    const { error: onboardingError } = await supabase
        .from('user_onboarding')
        .insert({
            user_id: userId,
            completed_at: new Date().toISOString() // Marca a data/hora da conclusão
        });

    if (onboardingError) {
        // Isso não deve quebrar o fluxo, mas é um aviso importante.
        // O usuário pode ficar em um loop se isso falhar.
        console.warn("Aviso: A trilha foi salva, mas falhou ao registrar a conclusão do onboarding.", onboardingError);
    }
    
    return true;
}


// ===================================================================
// FUNÇÕES HELPER (USADAS APENAS DENTRO DESTE ARQUIVO)
// ===================================================================

/**
 * Extrai de forma segura o conteúdo de texto de uma resposta da API do Gemini.
 * A estrutura da resposta do Gemini geralmente é: response.candidates[0].content.parts[0].text
 * Esta função usa "optional chaining" (?.) para evitar erros caso a estrutura mude ou alguma parte esteja faltando.
 *
 * @param {any} response O objeto de resposta completo retornado pela Edge Function.
 * @returns {string} O conteúdo de texto extraído ou uma mensagem de erro padrão se a extração falhar.
 */
function extractTextFromGeminiResponse(response: any): string {
  try {
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Estrutura de resposta inesperada do Gemini. Texto não encontrado.", response);
      throw new Error("O texto não foi encontrado na estrutura da resposta da IA.");
    }
    
    return text;

  } catch (error) {
    console.error("Erro crítico ao extrair texto da resposta do Gemini:", error);
    return "Não foi possível processar a resposta da IA. Tente novamente.";
  }
}

/**
 * Calcula a idade do usuário com base na data de nascimento.
 * @param {string} birthDate - A data de nascimento no formato "YYYY-MM-DD".
 * @returns {number} A idade calculada.
 */
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
    console.error("Data de nascimento inválida:", birthDate);
    return 0;
  }
}