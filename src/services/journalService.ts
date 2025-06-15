import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// A interface agora corresponde 100% à sua tabela no Supabase
export interface JournalEntry {
  id?: string;
  user_id: string;
  title: string;
  content: string;
  emoji?: string | null;
  is_favorite?: boolean;
  module_id?: number | null;
  phase_id?: number | null; // Coluna que adicionamos via SQL
  created_at?: string;
  updated_at?: string;
}

/**
 * Busca um resumo das entradas do diário para um usuário.
 * Exclui a coluna 'content' para otimizar o carregamento da lista.
 */
export const getJournalEntries = async (
  userId: string,
): Promise<JournalEntry[]> => {
  try {
    const { data, error } = await supabase
      .from("learning_journals")
      .select(
        "id, user_id, title, emoji, is_favorite, module_id, phase_id, created_at, updated_at, content",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar entradas do diário:", error);
      return [];
    }
    
    return data as JournalEntry[];
  } catch (error) {
    console.error("Exceção ao buscar entradas do diário:", error);
    return [];
  }
};

/**
 * Busca uma única entrada do diário com todos os seus detalhes, incluindo o conteúdo.
 */
export const getJournalEntry = async (
  id: string,
): Promise<JournalEntry | null> => {
  try {
    const { data, error } = await supabase
      .from("learning_journals")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar entrada do diário:", error);
      return null;
    }

    return data as JournalEntry;
  } catch (error) {
    console.error("Exceção ao buscar entrada do diário:", error);
    return null;
  }
};

/**
 * Cria uma nova entrada no diário.
 * Recebe um objeto com os dados e insere no banco.
 */
export const createJournalEntry = async (
  entryData: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>,
): Promise<JournalEntry | null> => {
  if (!entryData.user_id || !entryData.title || !entryData.content) {
    toast.error("Não foi possível salvar a anotação.", { description: "Faltam informações essenciais (título ou conteúdo)."});
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("learning_journals")
      .insert({
        user_id: entryData.user_id,
        title: entryData.title,
        content: entryData.content,
        emoji: entryData.emoji,
        is_favorite: entryData.is_favorite,
        module_id: entryData.module_id,
        phase_id: entryData.phase_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro do Supabase ao criar entrada no diário:", error);
      toast.error(`Erro ao criar entrada: ${error.message}`);
      return null;
    }

    toast.success("Anotação salva no seu diário!");
    return data as JournalEntry;
  } catch (error) {
    toast.error("Falha ao salvar entrada no diário. Tente novamente.");
    return null;
  }
};


/**
 * Atualiza uma entrada existente no diário.
 */
export const updateJournalEntry = async (
  entry: JournalEntry,
): Promise<boolean> => {
  if (!entry.id) return false;

  try {
    const { error } = await supabase
      .from("learning_journals")
      .update({
        title: entry.title,
        content: entry.content,
        emoji: entry.emoji,
        module_id: entry.module_id,
        phase_id: entry.phase_id,
        is_favorite: entry.is_favorite,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entry.id);

    if (error) {
      toast.error(`Erro ao atualizar entrada: ${error.message}`);
      return false;
    }

    toast.success("Anotação atualizada!");
    return true;
  } catch (error) {
    toast.error("Falha ao atualizar entrada. Tente novamente.");
    return false;
  }
};

/**
 * Alterna o status de favorito de uma entrada.
 */
export const toggleFavoriteJournalEntry = async (
  id: string,
  isFavorite: boolean,
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("learning_journals")
      .update({
        is_favorite: isFavorite,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao favoritar entrada:", error);
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Deleta uma entrada do diário.
 */
export const deleteJournalEntry = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("learning_journals")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(`Erro ao excluir entrada: ${error.message}`);
      return false;
    }

    toast.success("Anotação excluída com sucesso!");
    return true;
  } catch (error) {
    toast.error("Falha ao excluir entrada. Tente novamente.");
    return false;
  }
};

export default {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  toggleFavoriteJournalEntry,
  deleteJournalEntry,
};