import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, completedPhases } = await req.json();

    if (!userId || !completedPhases || completedPhases.length === 0) {
      throw new Error('userId e uma lista de completedPhases são obrigatórios.');
    }

    // Seleciona uma fase aleatória da lista fornecida
    const randomPhase = completedPhases[Math.floor(Math.random() * completedPhases.length)];

    // PONTO CRÍTICO: Lendo a chave secreta do ambiente da função
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('A configuração do servidor de IA está incompleta.');
    }

    // Prompt otimizado para gerar título personalizado + desafio
    const prompt = `Baseado na fase de aprendizado "${randomPhase.name}" com descrição: "${randomPhase.description}", crie:

1. UM TÍTULO PERSONALIZADO para o desafio (máximo 30 caracteres) que seja:
   - Relacionado ao conteúdo da fase
   - Divertido e motivador para jovens
   - Não use emojis
   - Gamificado (use palavras como: Missão, Jornada, Desafio, etc.)

2. UM DESAFIO PRÁTICO (máximo 5 minutos) com bullets objetivos

FORMATE EXATAMENTE ASSIM:

TÍTULO: [Título personalizado com emoji]

DESAFIO:
• [Ação específica 1]
• [Ação específica 2] 
• [Ação final motivadora]`;

    // Chamada segura para a API do Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8, // Criatividade para títulos únicos
          maxOutputTokens: 400,
        }
      }),
    });

    const geminiData = await geminiResponse.json();
    if (!geminiResponse.ok) {
      throw new Error(geminiData.error.message || 'Falha na comunicação com a IA.');
    }

    let fullResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!fullResponse) {
      throw new Error('A IA não conseguiu gerar um desafio.');
    }

    // Extrai título e desafio da resposta
    let challengeTitle = "🎯 Desafio Especial"; // fallback
    let challengeText = fullResponse;

    if (fullResponse.includes('TÍTULO:')) {
      const titleMatch = fullResponse.match(/TÍTULO:\s*(.+?)(?=\n|DESAFIO:|$)/);
      if (titleMatch) {
        challengeTitle = titleMatch[1].trim();
      }

      const challengeMatch = fullResponse.match(/DESAFIO:\s*([\s\S]+?)$/);
      if (challengeMatch) {
        challengeText = challengeMatch[1].trim();
      }
    }

    // Salva o desafio no banco de dados
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    expiresAt.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
      .from('daily_challenges')
      .insert({
        user_id: userId,
        challenge_text: challengeText,
        challenge_title: challengeTitle, // Nova coluna para título personalizado
        created_date: today,
        expires_at: expiresAt.toISOString(),
        completed: false,
        related_phase: randomPhase.name
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});