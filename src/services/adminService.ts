import { supabase } from "@/integrations/supabase/client";

// --- INTERFACES DE TIPO ---
// Definem a "forma" dos dados que esperamos receber do Supabase.
// Isso habilita o autocomplete e a verificação de tipos em todo o app.

export interface DashboardStats {
  userCount: number;
  completedPhasesCount: number;
  completedChallengesCount: number;
}

export interface TopUser {
  full_name: string | null;
  xp: number | null;
  avatar_url: string | null;
}

export interface NewUsersDataPoint {
    day: string; // Formato "YYYY-MM-DD"
    count: number;
}

// --- FUNÇÕES DE SERVIÇO ---

/**
 * Busca as principais estatísticas do dashboard (contagens).
 * Usa Promise.all para executar as chamadas de contagem em paralelo, otimizando o tempo de carregamento.
 * @returns {Promise<DashboardStats>} Um objeto com as contagens.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const [
            { count: userCount, error: userError },
            { count: completedPhasesCount, error: phasesError },
            { count: completedChallengesCount, error: challengesError }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('user_phases').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
            supabase.from('daily_challenges').select('*', { count: 'exact', head: true }).eq('completed', true)
        ]);

        if (userError) throw userError;
        if (phasesError) throw phasesError;
        if (challengesError) throw challengesError;

        return {
            userCount: userCount ?? 0,
            completedPhasesCount: completedPhasesCount ?? 0,
            completedChallengesCount: completedChallengesCount ?? 0,
        };
    } catch (error) {
        console.error("Erro ao buscar estatísticas do dashboard:", error);
        // Retorna um objeto com valores zerados para evitar que a UI quebre em caso de erro.
        return { userCount: 0, completedPhasesCount: 0, completedChallengesCount: 0 };
    }
}

/**
 * Busca os 5 usuários com a maior pontuação (XP).
 * @returns {Promise<TopUser[]>} Uma lista dos 5 melhores usuários.
 */
export async function getTopUsers(): Promise<TopUser[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('full_name, xp, avatar_url')
        .order('xp', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Erro ao buscar top usuários:", error);
        throw new Error('Não foi possível carregar o ranking de usuários.');
    }

    return data || [];
}

/**
 * Busca dados para o gráfico de novos usuários, agrupados por dia.
 * Chama a função RPC 'get_daily_new_users' que criamos no PostgreSQL.
 * @param {number} days - O número de dias para buscar. Padrão é 7.
 * @returns {Promise<NewUsersDataPoint[]>} Uma lista de pontos de dados para o gráfico.
 */
export async function getNewUsersChartData(days = 7): Promise<NewUsersDataPoint[]> {
    const { data, error } = await supabase.rpc<NewUsersDataPoint>('get_daily_new_users', {
        days_ago: days
    });

    if (error) {
        console.error("Erro ao buscar dados do gráfico de usuários:", error);
        throw new Error('Não foi possível carregar os dados do gráfico.');
    }
    
    return data || [];
}