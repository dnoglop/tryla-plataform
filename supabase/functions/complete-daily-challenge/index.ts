
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
    const { challengeId, userId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Marcar desafio como concluído
    const { error: updateError } = await supabase
      .from('daily_challenges')
      .update({ completed: true })
      .eq('id', challengeId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Adicionar XP
    const { error: xpError } = await supabase
      .from('xp_history')
      .insert({
        user_id: userId,
        xp_amount: 15,
        source: 'DAILY_CHALLENGE',
        source_id: challengeId
      });

    if (xpError) throw xpError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao completar desafio:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
