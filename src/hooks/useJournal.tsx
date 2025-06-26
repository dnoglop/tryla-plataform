// ARQUIVO: src/hooks/useJournal.ts (CORRIGIDO)

import { useState, useEffect, useMemo } from 'react'; // Adicionado useMemo
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  JournalEntry,
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  toggleFavoriteJournalEntry,
  deleteJournalEntry
} from '@/services/journalService';
import { useQuery } from '@tanstack/react-query';
import { getModules, Module } from '@/services/moduleService';
import { toast } from 'sonner';

export const useJournal = (moduleIdParam: string | null) => {
  const navigate = useNavigate();

  // --- ESTADO PRINCIPAL ---
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- ESTADO DOS MODAIS E FILTROS ---
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState<number | null>(moduleIdParam ? parseInt(moduleIdParam) : null);

  // O estado `filteredEntries` foi REMOVIDO.

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules
  });

  // Busca inicial de dados (sem alterações)
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

  // O `useEffect` para filtrar as anotações foi REMOVIDO.

  // --- CÁLCULO DO ESTADO DERIVADO ---
  // A lista filtrada agora é calculada diretamente em cada render.
  // Usamos `useMemo` para otimizar e evitar recálculos desnecessários.
  const filteredEntries = useMemo(() => {
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
    return filtered;
  }, [entries, searchTerm, activeTab, moduleFilter]);


  // --- FUNÇÕES DE MANIPULAÇÃO (sem grandes alterações) ---

  const handleCreateEntry = async (entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return;
    try {
      const newEntry = await createJournalEntry({ ...entry, user_id: userId });
      if (newEntry) {
        setEntries(prev => [newEntry, ...prev]);
        setIsCreating(false);
        setEditingEntry(null);
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

  const handleToggleFavorite = async (entryId: string) => {
    const originalEntries = [...entries];
    const entry = originalEntries.find((e) => e.id === entryId);
    if (!entry) return;

    const newFavoriteStatus = !entry.is_favorite;

    setEntries(currentEntries =>
      currentEntries.map(e =>
        e.id === entryId ? { ...e, is_favorite: newFavoriteStatus } : e
      )
    );

    try {
      await toggleFavoriteJournalEntry(entryId, newFavoriteStatus);
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      toast.error("Não foi possível atualizar o favorito.");
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

  // Funções auxiliares (sem alterações)
  const clearModuleFilter = () => {
    setModuleFilter(null);
    navigate('/diario');
  };

  const getModuleNameById = (id: number | null | undefined): string | null => {
    if (id === null || id === undefined) return null;
    const module = modules.find((m: Module) => m.id === id);
    return module ? module.name : 'Módulo Desconhecido';
  };

  // O hook agora retorna o `filteredEntries` calculado.
  return {
    userId,
    entries,
    filteredEntries, // Este agora é um valor calculado, não um estado.
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