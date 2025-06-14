
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY não foi definida nas variáveis de ambiente.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

// Cabeçalhos CORS corretos
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  // Lida com requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Gere uma única frase curta e inspiradora para um jovem que está em uma jornada de autoconhecimento e desenvolvimento de habilidades. 
      A frase deve ser positiva, direta e motivacional. 
      Use uma linguagem moderna e acessível, como se fosse um mentor gente boa falando. 
      Não inclua aspas na resposta.
      A resposta deve ter no máximo 150 caracteres.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return new Response(
      JSON.stringify({ quote: text }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Erro ao gerar citação do Gemini:", error);
    return new Response(
      JSON.stringify({ error: "Não foi possível gerar a citação." }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
