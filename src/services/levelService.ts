// Em algum arquivo de serviço, como src/services/levelService.ts
import { supabase } from "@/integrations/supabase/client";

export interface Level {
    id: number;
    name: string;
    min_xp: number;
}

export const getLevels = async (): Promise<Level[]> => {
    const { data, error } = await supabase
        .from("levels")
        .select("id, name, min_xp")
        .order("min_xp", { ascending: true }); // Essencial para ordenar os níveis corretamente

    if (error) {
        console.error("Erro ao buscar níveis:", error);
        return [];
    }

    return data;
};
