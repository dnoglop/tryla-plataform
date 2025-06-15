import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (_req) => {
  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("A configuração do servidor de IA está incompleta.");
    }

    const prompt = "Gere uma única frase curta (máximo 150 caracteres), inspiradora e direta para um jovem estudante na sua jornada de evolução pessoal e profissional. Tom de mentor amigável. Não use aspas.";

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;
    const geminiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const geminiData = await geminiResponse.json();
    if (!geminiResponse.ok) {
        throw new Error(geminiData.error.message || "Falha na comunicação com a IA.");
    }

    const quote = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!quote) {
        throw new Error('A IA não conseguiu gerar uma frase.');
    }

    return new Response(JSON.stringify({ quote }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});