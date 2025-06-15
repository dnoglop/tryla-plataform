import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

interface TutorRequest {
  prompt: string;
  userName?: string;
  // Opcional: você pode expandir para usar o histórico aqui
  // history: { role: 'user' | 'model', parts: { text: string }[] }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, userName = "aluno(a)" }: TutorRequest = await req.json();
    if (!prompt) throw new Error("O 'prompt' do usuário é obrigatório.");

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('A configuração do servidor de IA está incompleta.');
    }
    
    // Montamos um prompt com a "persona" do tutor
    const fullPrompt = `Você é a "IAê", uma tutora de desenvolvimento pessoal amigável, motivacional e especialista em psicologia positiva e carreira. O usuário se chama ${userName}. Responda à seguinte pergunta de forma concisa e útil, sempre mantendo sua persona. Pergunta: "${prompt}"`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] }),
    });

    const geminiData = await geminiResponse.json();
    if (!geminiResponse.ok) {
      throw new Error(geminiData.error.message || 'Falha na comunicação com a IA.');
    }

    const tutorResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!tutorResponseText) {
      throw new Error('A IA não conseguiu gerar uma resposta.');
    }

    return new Response(JSON.stringify({ resposta: tutorResponseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});