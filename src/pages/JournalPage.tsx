
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, ArrowLeft, Search, Star, ClipboardList, BookIcon, ListFilter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  JournalEntry as JournalEntryType, 
  createJournalEntry,
  getJournalEntries,
  updateJournalEntry,
  toggleFavoriteJournalEntry,
  deleteJournalEntry
} from '@/services/journalService';
import { useQuery } from '@tanstack/react-query';
import { getModules, Module } from '@/services/moduleService';
import JournalEntry from '@/components/journal/JournalEntry';
import JournalForm from '@/components/journal/JournalForm';
import EmptyJournal from '@/components/journal/EmptyJournal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const JournalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const moduleIdParam = queryParams.get('moduleId');
  
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntryType[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [editingEntry, setEditingEntry] = useState<JournalEntryType | null>(null);
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

  const handleCreateEntry = async (entry: JournalEntryType) => {
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

  const handleUpdateEntry = async (entry: JournalEntryType) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-trilha-orange border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white p-4 border-b flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate('/perfil')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg ml-2">Diário de Aprendizado</h1>
        </div>
        <Button 
          onClick={() => {
            setEditingEntry(null);
            setIsCreating(true);
          }}
          size="sm"
          className="bg-trilha-orange hover:bg-amber-600"
        >
          <Plus className="h-4 w-4 mr-1" /> Nova
        </Button>
      </header>

      <div className="p-4">
        {isCreating && userId && (
          <div className="mb-4">
            <JournalForm 
              userId={userId}
              onSubmit={handleCreateEntry}
              onCancel={() => setIsCreating(false)}
              currentModuleId={moduleFilter}
            />
          </div>
        )}
        
        {editingEntry && userId && (
          <div className="mb-4">
            <JournalForm 
              entry={editingEntry}
              userId={userId}
              onSubmit={handleUpdateEntry}
              onCancel={() => setEditingEntry(null)}
            />
          </div>
        )}
        
        {!isCreating && !editingEntry && (
          <>
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar anotações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <ListFilter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuItem 
                      className={!moduleFilter ? "bg-gray-100" : ""} 
                      onClick={clearModuleFilter}
                    >
                      <BookIcon className="mr-2 h-4 w-4" />
                      <span>Todos os módulos</span>
                    </DropdownMenuItem>
                    {modules.map((module: Module) => (
                      <DropdownMenuItem 
                        key={module.id}
                        className={moduleFilter === module.id ? "bg-gray-100" : ""}
                        onClick={() => setModuleFilter(module.id)}
                      >
                        <span className="mr-2">{module.emoji || '📚'}</span>
                        <span>{module.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {moduleFilter !== null && (
              <div className="bg-blue-50 rounded-md p-2 mb-4 flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  Filtrado por: {getModuleNameById(moduleFilter)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearModuleFilter} 
                  className="text-blue-700 h-6 px-2"
                >
                  Limpar
                </Button>
              </div>
            )}
            
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="mb-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all" className="flex items-center">
                  <ClipboardList className="h-4 w-4 mr-1" />
                  Todas
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Favoritas
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                {entries.length === 0 ? (
                  <EmptyJournal onNewEntry={() => setIsCreating(true)} />
                ) : filteredEntries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma anotação encontrada
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEntries.map(entry => (
                      <JournalEntry
                        key={entry.id}
                        entry={entry}
                        onEdit={setEditingEntry}
                        onDelete={(id) => setDeleteId(id)}
                        onToggleFavorite={handleToggleFavorite}
                        moduleName={getModuleNameById(entry.module_id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="favorites" className="mt-4">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma anotação favorita
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEntries.map(entry => (
                      <JournalEntry
                        key={entry.id}
                        entry={entry}
                        onEdit={setEditingEntry}
                        onDelete={(id) => setDeleteId(id)}
                        onToggleFavorite={handleToggleFavorite}
                        moduleName={getModuleNameById(entry.module_id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anotação</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A anotação será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JournalPage;
