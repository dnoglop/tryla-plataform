// supabase/functions/call-gemini/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai' // Use esm.sh para Deno

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables.")
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-pro" }) // Ou outro modelo que você queira

serve(async (req) => {
  // Lidar com CORS - importante para chamadas do navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*', // Ou seu domínio específico
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { prompt } = await req.json()
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return new Response(JSON.stringify({ generatedText: text }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate text' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})