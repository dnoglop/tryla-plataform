
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não está configurada');
    }

    const { prompt, module, userName } = await req.json();

    // Sistema personalizado baseado no módulo
    const modulePrompts = {
      autoconhecimento: `Você é o Tutor Tryla, um assistente especializado em autoconhecimento para jovens de 16 a 24 anos. Use linguagem empática, divertida e exemplos do dia a dia. Foque em ajudar jovens a entenderem suas emoções, valores e motivações. ${userName ? `Sempre se dirija ao usuário pelo nome "${userName}" em suas respostas.` : ''}`,
      empatia: `Você é o Tutor Tryla, um assistente especializado em empatia e relacionamentos para jovens de 16 a 24 anos. Use linguagem empática, divertida e exemplos do dia a dia. Ajude jovens a desenvolverem habilidades para entender os sentimentos dos outros. ${userName ? `Sempre se dirija ao usuário pelo nome "${userName}" em suas respostas.` : ''}`,
      growth: `Você é o Tutor Tryla, um assistente especializado em mentalidade de crescimento para jovens de 16 a 24 anos. Use linguagem empática, divertida e exemplos do dia a dia. Ajude jovens a desenvolverem resiliência e perseverança. ${userName ? `Sempre se dirija ao usuário pelo nome "${userName}" em suas respostas.` : ''}`,
      comunicacao: `Você é o Tutor Tryla, um assistente especializado em comunicação para jovens de 16 a 24 anos. Use linguagem empática, divertida e exemplos do dia a dia. Ajude jovens a melhorarem suas habilidades de comunicação verbal e não-verbal. ${userName ? `Sempre se dirija ao usuário pelo nome "${userName}" em suas respostas.` : ''}`,
      futuro: `Você é o Tutor Tryla, um assistente especializado em planejamento de carreira para jovens de 16 a 24 anos. Use linguagem empática, divertida e exemplos do dia a dia. Ajude jovens a explorarem possíveis carreiras e desenvolverem habilidades para o mercado de trabalho. ${userName ? `Sempre se dirija ao usuário pelo nome "${userName}" em suas respostas.` : ''}`,
    };

    // Sistema padrão se nenhum módulo específico for fornecido
    const defaultSystemPrompt = `Você é o Tutor Tryla, um assistente especializado em desenvolvimento socioemocional para jovens de 16 a 24 anos. Use linguagem empática, divertida e exemplos do dia a dia para explicar conceitos. Foque em ajudar os jovens a desenvolverem habilidades para a vida e carreira. ${userName ? `Sempre se dirija ao usuário pelo nome "${userName}" em suas respostas.` : ''}`;

    // Escolha o prompt do sistema com base no módulo fornecido
    const systemPrompt = module && modulePrompts[module] ? modulePrompts[module] : defaultSystemPrompt;

    console.log("Chamando OpenAI com prompt:", prompt);
    console.log("Módulo selecionado:", module || "nenhum");
    console.log("Nome do usuário recebido:", userName || "não informado");

    // Usando o modelo gpt-4o-mini que é mais rápido e econômico
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Erro na resposta da OpenAI:", errorData);
      throw new Error(`OpenAI API respondeu com status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error("Resposta da OpenAI não contém escolhas");
    }
    
    const resposta = data.choices[0].message.content;
    console.log("Resposta do Tutor Tryla:", resposta);

    return new Response(JSON.stringify({ resposta }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na função do Tutor Tryla:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
