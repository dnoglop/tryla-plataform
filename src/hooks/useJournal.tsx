// src/hooks/useJournal.ts

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  JournalEntry,
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  toggleFavoriteJournalEntry, // Vamos usar esta
  deleteJournalEntry
} from '@/services/journalService';
import { useQuery } from '@tanstack/react-query';
import { getModules, Module } from '@/services/moduleService';
import { toast } from 'sonner'; // Importar o toast para feedback de erro

export const useJournal = (moduleIdParam: string | null) => {
  const navigate = useNavigate();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState<number | null>(moduleIdParam ? parseInt(moduleIdParam) : null);

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules
  });

  useEffect(() => {
    if (moduleIdParam) {
      setModuleFilter(parseInt(moduleIdParam));
    }
  }, [moduleIdParam]);

  useEffect(() => {
    const fetchUserAndEntries = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        setUserId(user.id);
        const journalEntries = await getJournalEntries(user.id);
        // Ordena por data de criação, mais recentes primeiro
        journalEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setEntries(journalEntries);
      } catch (error) {
        console.error('Erro ao carregar diário:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserAndEntries();
  }, [navigate]);

  useEffect(() => {
    let filtered = [...entries];
    if (activeTab === 'favorites') {
      filtered = filtered.filter(entry => entry.is_favorite);
    }
    if (moduleFilter !== null) {
      filtered = filtered.filter(entry => entry.module_id === moduleFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(entry => 
        (entry.title && entry.title.toLowerCase().includes(term)) || 
        (entry.content && entry.content.toLowerCase().includes(term))
      );
    }
    setFilteredEntries(filtered);
  }, [entries, searchTerm, activeTab, moduleFilter]);

  const handleCreateEntry = async (entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return;
    try {
      const newEntry = await createJournalEntry({ ...entry, user_id: userId });
      if (newEntry) {
        setEntries(prev => [newEntry, ...prev]);
        setIsCreating(false);
        setEditingEntry(null); // Garante que o modo de edição também seja fechado
      }
    } catch (error) {
      console.error('Erro ao criar entrada:', error);
      toast.error('Não foi possível criar a anotação.');
    }
  };

  const handleUpdateEntry = async (entry: JournalEntry) => {
    if (!userId || !entry.id) return;
    try {
      const updatedEntry = await updateJournalEntry(entry);
      if (updatedEntry) {
        setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
        setEditingEntry(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar entrada:', error);
      toast.error('Não foi possível salvar as alterações.');
    }
  };

  // --- FUNÇÃO CORRIGIDA E OTIMIZADA ---
  const handleToggleFavorite = async (entryId: string) => {
    const originalEntries = [...entries];
    const entry = originalEntries.find((e) => e.id === entryId);
    if (!entry) return;

    const newFavoriteStatus = !entry.is_favorite;

    // Atualização Otimista da UI
    setEntries(currentEntries =>
      currentEntries.map(e =>
        e.id === entryId ? { ...e, is_favorite: newFavoriteStatus } : e
      )
    );

    // Chamada ao serviço de backend
    try {
      await toggleFavoriteJournalEntry(entryId, newFavoriteStatus);
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      toast.error("Não foi possível atualizar o favorito.");
      // Reverte a mudança na UI em caso de erro
      setEntries(originalEntries);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteJournalEntry(deleteId);
      setEntries(prev => prev.filter(entry => entry.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error('Erro ao excluir entrada:', error);
      toast.error("Não foi possível apagar a anotação.");
    }
  };

  const clearModuleFilter = () => {
    setModuleFilter(null);
    navigate('/diario');
  };

  const getModuleNameById = (id: number | null | undefined): string | null => {
    if (id === null || id === undefined) return null;
    const module = modules.find((m: Module) => m.id === id);
    // Retorna apenas o nome para o card, o emoji pode ser adicionado na UI se necessário
    return module ? module.name : 'Módulo Desconhecido';
  };

  return {
    userId,
    entries,
    filteredEntries,
    isLoading,
    isCreating,
    setIsCreating,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    editingEntry,
    setEditingEntry,
    deleteId,
    setDeleteId,
    moduleFilter,
    setModuleFilter,
    modules,
    handleCreateEntry,
    handleUpdateEntry,
    handleToggleFavorite,
    handleConfirmDelete,
    clearModuleFilter,
    getModuleNameById
  };
};