
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, completedPhases } = await req.json();

    if (!completedPhases || completedPhases.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhuma fase completada encontrada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Selecionar uma fase aleatória
    const randomPhase = completedPhases[Math.floor(Math.random() * completedPhases.length)];

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    const prompt = `
      Você é Tryla, uma mentora de carreira para jovens brasileiros. 
      
      Crie um desafio prático e rápido (até 5 minutos) baseado na fase "${randomPhase.name}" do módulo "${randomPhase.moduleName}".
      
      Descrição da fase: ${randomPhase.description}
      
      O desafio deve ser:
      - Prático e aplicável no dia a dia
      - Possível de completar em até 5 minutos
      - Motivador e educativo
      - Relacionado ao conteúdo da fase
      
      Responda APENAS com o texto do desafio, sem introduções ou explicações adicionais.
      Máximo de 150 palavras.
    `;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Erro na API Gemini: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const challenge = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Desafio não pôde ser gerado';

    // Salvar no banco
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('daily_challenges')
      .insert({
        user_id: userId,
        challenge_text: challenge,
        created_date: today,
        expires_at: tomorrow.toISOString(),
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
    console.error('Erro ao gerar desafio:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
