// src/lib/interviewService.ts

import { supabase } from "@/integrations/supabase/client";

// Tipagem para o formulário de setup
export interface InterviewContext {
  company: string;
  level: string;
  jobDescription: string;
  resume: string;
}

/**
 * Pede à IA para gerar uma lista de perguntas para a entrevista.
 * @param context - O contexto da vaga e do candidato.
 * @returns Uma promessa que resolve para um array de strings (as perguntas).
 */
export async function generateInterviewQuestions(
  context: InterviewContext,
): Promise<string[]> {
  const prompt = `
    Você é um recrutador sênior e especialista em RH da empresa "${context.company}".
    Sua tarefa é preparar uma entrevista para a vaga de "${context.level}" descrita abaixo.
    Considere também o resumo do currículo do candidato.

    **Descrição da Vaga:**
    ${context.jobDescription}

    **Currículo do Candidato:**
    ${context.resume}

    **Instruções:**
    Gere uma lista de 7 a 9 perguntas de entrevista variadas (comportamentais, técnicas e situacionais)
    que sejam altamente relevantes para esta vaga e este candidato.
    Retorne as perguntas em um formato JSON de um array de strings.
    Exemplo de formato de saída: ["Pergunta 1", "Pergunta 2", "Pergunta 3"]
  `;

  try {
    const { data, error } = await supabase.functions.invoke("call-gemini", {
      body: { prompt },
    });

    if (error) throw error;

    // A IA pode retornar o JSON dentro de um bloco de código markdown, então limpamos isso.
    const responseText = data.candidates[0].content.parts[0].text;
    const jsonString = responseText.replace(/```json|```/g, "").trim();

    // Tenta parsear a string para um array
    const questions = JSON.parse(jsonString);
    if (Array.isArray(questions)) {
      return questions;
    }
    throw new Error("A IA não retornou um array de perguntas válido.");
  } catch (err) {
    console.error("Erro ao gerar perguntas da entrevista:", err);
    // Retorna perguntas genéricas em caso de falha
    return [
      "Fale um pouco sobre você e sua trajetória profissional.",
      "Por que você se interessou por esta vaga na nossa empresa?",
      "Descreva uma situação desafiadora que você enfrentou e como a superou.",
      "Quais são seus principais pontos fortes e fracos?",
      "Onde você se vê daqui a 5 anos?",
    ];
  }
}

/**
 * Pede à IA para avaliar a resposta de um candidato e fornecer feedback.
 * @param question - A pergunta que foi feita.
 * @param answer - A resposta do usuário.
 * @param context - O contexto geral da entrevista.
 * @returns Uma promessa que resolve para uma string contendo o feedback em Markdown.
 */
export async function getAnswerFeedback(
  question: string,
  answer: string,
  context: InterviewContext,
): Promise<string> {
  const prompt = `
    Você é um coach de carreira e especialista em entrevistas. Seu tom é construtivo, encorajador e direto.

    **Contexto da Entrevista:**
    - Empresa: ${context.company}
    - Vaga: ${context.level}
    - Descrição: ${context.jobDescription}

    **Análise da Resposta:**
    - Pergunta Feita: "${question}"
    - Resposta do Candidato: "${answer}"

    **Sua Tarefa:**
    Forneça um feedback sobre a resposta do candidato. Analise os seguintes pontos:
    1.  **Clareza e Estrutura:** A resposta foi bem estruturada (ex: usando a técnica STAR)?
    2.  **Relevância:** A resposta abordou diretamente o que foi perguntado?
    3.  **Impacto:** A resposta demonstrou as habilidades e o valor do candidato?

    **Formato da Saída (use Markdown):**
    - Comece com um emoji (👍 ou 🤔).
    - **Ponto Forte:** Destaque um aspecto positivo da resposta.
    - **Ponto de Melhoria:** Dê uma sugestão prática e específica para aprimorar a resposta.
    - Finalize com uma frase curta de encorajamento.
  `;

  try {
    const { data, error } = await supabase.functions.invoke("call-gemini", {
      body: { prompt },
    });
    if (error) throw error;
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("Erro ao gerar feedback da resposta:", err);
    return "🤔 Não consegui processar o feedback para esta resposta. Vamos para a próxima pergunta.";
  }
}
