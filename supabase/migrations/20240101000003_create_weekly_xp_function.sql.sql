-- supabase/migrations/xxxxxxxx_create_weekly_xp_function.sql

CREATE OR REPLACE FUNCTION get_weekly_xp_sum(
    user_id_param uuid
)
RETURNS TABLE (day date, total_xp bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Gera uma série de datas da segunda-feira até o domingo da semana atual
        d.date::date as day,
        -- Soma o XP para cada dia, retornando 0 se não houver registros
        COALESCE(SUM(dxp.xp_earned), 0)::bigint as total_xp
    FROM
        generate_series(
            date_trunc('week', now() at time zone 'utc')::date,
            (date_trunc('week', now() at time zone 'utc') + '6 days'::interval)::date,
            '1 day'::interval
        ) AS d(date)
    LEFT JOIN
        daily_xp_progress AS dxp ON dxp.date::date = d.date AND dxp.user_id = user_id_param
    GROUP BY
        d.date
    ORDER BY
        d.date;
END;
$$ LANGUAGE plpgsql;