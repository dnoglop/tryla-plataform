import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Esta é a função assíncrona que realmente faz a chamada para a sua Edge Function.
 * O react-query vai gerenciá-la para nós.
 */
const fetchDailyQuote = async (): Promise<string> => {
  // Invoca a Edge Function 'get-daily-quote' que criamos no Supabase.
  const { data, error } = await supabase.functions.invoke('get-daily-quote');

  // Se houver um erro de rede ou da própria função, lançamos um erro.
  // O react-query irá capturar este erro e colocar a query no estado 'isError'.
  if (error) {
    throw new Error(`Erro na Edge Function: ${error.message}`);
  }

  // A função pode retornar um objeto de erro lógico (ex: { error: "mensagem" })
  if (data.error) {
      throw new Error(`Erro retornado pela IA: ${data.error}`);
  }

  // Se tudo deu certo, retorna a frase.
  // Incluímos um fallback caso a resposta venha sem a propriedade 'quote'.
  return data.quote || "Continue firme em sua jornada. Cada passo conta!";
};

/**
 * Este é o hook personalizado.
 * Ele usa o useQuery do react-query para buscar a frase do dia,
 * com uma lógica de cache inteligente.
 */
export const useDailyQuote = () => {
  return useQuery({
    // 'dailyQuote' é a chave única para esta query. O react-query usa isso para o cache.
    // Adicionamos a data para que a chave seja diferente a cada dia, forçando um refetch diário.
    queryKey: ['dailyQuote', new Date().toISOString().split('T')[0]], 
    
    // A função que será executada para buscar os dados.
    queryFn: fetchDailyQuote,
    
    // Configurações de cache:
    // staleTime: Por quanto tempo o dado é considerado "fresco" e não precisa ser buscado novamente. 24 horas.
    staleTime: 1000 * 60 * 60 * 24, 
    
    // gcTime (anteriormente cacheTime): Por quanto tempo o dado permanece no cache, mesmo que não esteja sendo usado. 24 horas.
    gcTime: 1000 * 60 * 60 * 24, 
    
    // Evita buscar novamente só porque o usuário trocou de aba e voltou.
    refetchOnWindowFocus: false, 
    
    // Em caso de erro de rede, tenta novamente apenas 1 vez.
    retry: 1, 
  });
};