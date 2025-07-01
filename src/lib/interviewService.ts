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
 * (Esta função permanece a mesma)
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
    Mapeie os gaps e gere uma lista de 4-6 perguntas de entrevista variadas (comportamentais, técnicas e situacionais)
    que sejam altamente relevantes para esta vaga e este candidato.
    Retorne as perguntas em um formato JSON de um array de strings.
    Exemplo de formato de saída: ["Pergunta 1", "Pergunta 2"]
  `;

  try {
    const { data, error } = await supabase.functions.invoke("call-gemini", {
      body: { prompt },
    });
    if (error) throw error;
    const responseText = data.candidates[0].content.parts[0].text;
    const jsonString = responseText.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(jsonString);
    if (Array.isArray(questions) && questions.length > 0) {
      return questions;
    }
    throw new Error("A IA não retornou um array de perguntas válido.");
  } catch (err) {
    console.error("Erro ao gerar perguntas da entrevista:", err);
    return [
      "Fale um pouco sobre você e sua trajetória profissional.",
      "Por que você se interessou por esta vaga na nossa empresa?",
      "Descreva uma situação desafiadora que você enfrentou e como a superou.",
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
  context: Omit<InterviewContext, 'resume' | 'jobDescription'>, // Contexto mínimo
): Promise<string> {
  const prompt = `
    Você é um coach de carreira e especialista em entrevista. Avalie a resposta do candidato para a pergunta da entrevista.
    Contexto: Vaga de ${context.level} na ${context.company}.

    Pergunta: "${question}"
    Resposta: "${answer}"

    Forneça um feedback em Markdown com:
    - Um emoji (👍 ou 🤔).
    - **Ponto Forte:**
    - **Ponto de Melhoria:**
    - Uma frase de encorajamento.
  `;

  try {
    const { data, error } = await supabase.functions.invoke("call-gemini", { body: { prompt } });
    if (error) throw error;
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("Erro ao gerar feedback da resposta:", err);
    return "🤔 Não consegui processar o feedback. Vamos para a próxima pergunta.";
  }
}

// --- Feedback Geral (Radicalmente Otimizado) ---
export async function getOverallFeedback(
    answers: { question: string; answer: string }[],
    context: Omit<InterviewContext, 'resume'>
): Promise<{ score: number; feedback: string }> {

    // << AQUI ESTÁ A OTIMIZAÇÃO CRUCIAL >>
    // Em vez de enviar a transcrição completa, criamos um resumo estruturado.
    // Isso reduz o tamanho do prompt em 80-90%, evitando timeouts e erros de limite.
    const interviewSummary = answers
        .map((qa, index) => 
            `- Pergunta ${index + 1}: ${qa.question.substring(0, 150)}... ` + // Pega só o início da pergunta
            `(Início da Resposta do Candidato: ${qa.answer.substring(0, 300)}...)` // Pega só o início da resposta
        )
        .join('\n');

    const prompt = `
        Você é um Diretor de RH experiente e um coach de carreira sênior.

        **Contexto da Vaga:**
        - Vaga: ${context.level} na ${context.company}.
        - Requisitos Principais da Vaga: ${context.jobDescription.substring(0, 500)}...

        **Resumo do Desempenho do Candidato na Entrevista:**
        ${interviewSummary}

        **Sua Tarefa:**
        Com base no resumo da entrevista e nos requisitos da vaga, realize as seguintes ações:
        1.  **Inferir o Desempenho:** Analise o fluxo da conversa. O candidato pareceu consistente e relevante?
        2.  **Atribuir uma Pontuação:** Dê uma nota realista de 0 a 100. Seja criterioso.
        3.  **Fornecer Feedback e Plano de Ação:** Escreva uma análise geral e um plano de ação prático em Markdown. Foque em aspectos como estrutura de resposta (mesmo sem ver o texto completo), comunicação e alinhamento com a vaga.

        **Formato da Saída:**
        Retorne **APENAS e SOMENTE** um objeto JSON válido.
        {
          "score": <number>,
          "feedback": "<string em formato Markdown contendo a análise e o plano de ação, com quebras de linha escapadas (\\n)>"
        }
    `;

    let responseText = '';
    try {
        const { data, error } = await supabase.functions.invoke("call-gemini", { body: { prompt } });
        if (error) throw error;

        responseText = data.candidates[0].content.parts[0].text;

        const startIndex = responseText.indexOf('{');
        const endIndex = responseText.lastIndexOf('}');

        if (startIndex === -1 || endIndex === -1) {
            throw new Error("A resposta da IA não continha um objeto JSON válido.");
        }

        const jsonString = responseText.substring(startIndex, endIndex + 1);
        const result = JSON.parse(jsonString);

        if (typeof result.score === 'number' && typeof result.feedback === 'string') {
            return result;
        }

        throw new Error('O objeto JSON retornado pela IA não tem a estrutura esperada.');

    } catch (err) {
        console.error("Erro ao gerar/processar feedback geral:", err);
        console.error("Resposta completa da IA que causou o erro:", responseText);

        return {
            score: 75,
            feedback: "### Análise Geral\nOcorreu um erro ao gerar a análise detalhada, mas você completou a simulação com sucesso!\n\n### Plano de Ação\n1. Revise suas respostas e os feedbacks individuais.\n2. Pratique novamente focando nos pontos de melhoria identificados."
        };
    }
}