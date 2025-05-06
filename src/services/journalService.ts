
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface JournalEntry {
  id?: string;
  user_id: string;
  title: string;
  content: string;
  emoji?: string | null;
  is_favorite?: boolean;
  module_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  try {
    const { data, error } = await supabase
      .from("learning_journals")
      .select("*")
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

export const getJournalEntry = async (id: string): Promise<JournalEntry | null> => {
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

export const createJournalEntry = async (entry: JournalEntry): Promise<JournalEntry | null> => {
  try {
    // Remove ID completely to let Supabase generate it
    const { id, ...entryData } = entry;
    
    const { data, error } = await supabase
      .from("learning_journals")
      .insert([entryData])
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao criar entrada no diário: ${error.message}`);
      return null;
    }

    toast.success("Entrada adicionada ao diário!");
    return data as JournalEntry;
  } catch (error) {
    console.error("Exceção ao criar entrada no diário:", error);
    toast.error("Falha ao salvar entrada no diário. Tente novamente.");
    return null;
  }
};

export const updateJournalEntry = async (entry: JournalEntry): Promise<boolean> => {
  if (!entry.id) return false;
  
  try {
    const { error } = await supabase
      .from("learning_journals")
      .update({
        title: entry.title,
        content: entry.content,
        emoji: entry.emoji,
        module_id: entry.module_id,
        is_favorite: entry.is_favorite,
        updated_at: new Date().toISOString()
      })
      .eq("id", entry.id);

    if (error) {
      toast.error(`Erro ao atualizar entrada no diário: ${error.message}`);
      return false;
    }

    toast.success("Entrada no diário atualizada!");
    return true;
  } catch (error) {
    console.error("Exceção ao atualizar entrada no diário:", error);
    toast.error("Falha ao atualizar entrada no diário. Tente novamente.");
    return false;
  }
};

export const toggleFavoriteJournalEntry = async (id: string, isFavorite: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("learning_journals")
      .update({
        is_favorite: isFavorite,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao marcar entrada como favorita:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exceção ao marcar entrada como favorita:", error);
    return false;
  }
};

export const deleteJournalEntry = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("learning_journals")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(`Erro ao excluir entrada do diário: ${error.message}`);
      return false;
    }

    toast.success("Entrada excluída com sucesso!");
    return true;
  } catch (error) {
    console.error("Exceção ao excluir entrada do diário:", error);
    toast.error("Falha ao excluir entrada do diário. Tente novamente.");
    return false;
  }
};

export default {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  toggleFavoriteJournalEntry,
  deleteJournalEntry
};
