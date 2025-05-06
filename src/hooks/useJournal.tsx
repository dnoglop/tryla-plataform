
import { useState, useEffect } from 'react';
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

  // Buscar módulos para o filtro
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
        // Obter usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }
        
        setUserId(user.id);
        
        // Buscar entradas do diário
        const journalEntries = await getJournalEntries(user.id);
        setEntries(journalEntries);
        setFilteredEntries(journalEntries);
      } catch (error) {
        console.error('Erro ao carregar diário:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserAndEntries();
  }, [navigate]);
  
  // Filtrar entradas quando o termo de busca, a tab ativa ou o filtro de módulo mudar
  useEffect(() => {
    if (entries.length === 0) {
      setFilteredEntries([]);
      return;
    }
    
    let filtered = [...entries];
    
    // Filtrar por tab
    if (activeTab === 'favorites') {
      filtered = filtered.filter(entry => entry.is_favorite);
    }
    
    // Filtrar por módulo
    if (moduleFilter !== null) {
      filtered = filtered.filter(entry => entry.module_id === moduleFilter);
    }
    
    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(term) || 
        entry.content.toLowerCase().includes(term)
      );
    }
    
    setFilteredEntries(filtered);
  }, [entries, searchTerm, activeTab, moduleFilter]);

  const handleCreateEntry = async (entry: JournalEntry) => {
    if (!userId) return;
    
    try {
      const newEntry = await createJournalEntry(entry);
      
      if (newEntry) {
        setEntries(prev => [newEntry, ...prev]);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Erro ao criar entrada:', error);
    }
  };

  const handleUpdateEntry = async (entry: JournalEntry) => {
    if (!userId || !entry.id) return;
    
    try {
      const success = await updateJournalEntry(entry);
      
      if (success) {
        setEntries(prev => prev.map(e => 
          e.id === entry.id ? entry : e
        ));
        setEditingEntry(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar entrada:', error);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      const success = await toggleFavoriteJournalEntry(id, isFavorite);
      
      if (success) {
        setEntries(prev => prev.map(entry => 
          entry.id === id ? { ...entry, is_favorite: isFavorite } : entry
        ));
      }
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      const success = await deleteJournalEntry(deleteId);
      
      if (success) {
        setEntries(prev => prev.filter(entry => entry.id !== deleteId));
        setDeleteId(null);
      }
    } catch (error) {
      console.error('Erro ao excluir entrada:', error);
    }
  };

  const clearModuleFilter = () => {
    setModuleFilter(null);
    navigate('/diario');
  };

  const getModuleNameById = (id: number | null | undefined) => {
    if (!id) return null;
    const module = modules.find((m: Module) => m.id === id);
    return module ? `${module.emoji || '📚'} ${module.name}` : null;
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
