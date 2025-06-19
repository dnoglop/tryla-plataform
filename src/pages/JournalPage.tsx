import React from 'react';
import { useLocation } from 'react-router-dom';
import { useJournal } from '@/hooks/useJournal';
import { getJournalEntry } from '@/services/journalService'; // <-- IMPORTANTE
import JournalHeader from '@/components/journal/JournalHeader';
import JournalSearchBar from '@/components/journal/JournalSearchBar';
import ModuleFilterBadge from '@/components/journal/ModuleFilterBadge';
import JournalTabs from '@/components/journal/JournalTabs';
import JournalForm from '@/components/journal/JournalForm';
import DeleteJournalDialog from '@/components/journal/DeleteJournalDialog';

const JournalPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const moduleIdParam = queryParams.get('moduleId');
  
  const { 
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
  } = useJournal(moduleIdParam);

  // --- MUDANÇA PRINCIPAL AQUI ---
  // Nova função para lidar com a edição
  const handleEditClick = async (entryToEdit: { id?: string }) => {
    if (!entryToEdit.id) return;
    
    // Mostra um loading ou skeleton se desejar
    
    // Busca a entrada completa, incluindo o 'content'
    const fullEntry = await getJournalEntry(entryToEdit.id);
    
    if (fullEntry) {
      // Passa a entrada completa para o estado de edição
      setEditingEntry(fullEntry);
    } else {
      // Lida com o caso de não encontrar a entrada
      alert("Não foi possível carregar a anotação para edição.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <JournalHeader 
        onNewEntry={() => {
          setEditingEntry(null);
          setIsCreating(true);
        }} 
      />

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
            <JournalSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              modules={modules}
              moduleFilter={moduleFilter}
              onModuleFilterChange={setModuleFilter}
              clearModuleFilter={clearModuleFilter}
            />
            
            <ModuleFilterBadge 
              moduleName={getModuleNameById(moduleFilter)} 
              onClearFilter={clearModuleFilter} 
            />
            
            <JournalTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              entries={entries}
              filteredEntries={filteredEntries}
              onNewEntry={() => setIsCreating(true)}
              // --- USA A NOVA FUNÇÃO DE EDIÇÃO ---
              onEdit={handleEditClick}
              onDelete={(id) => setDeleteId(id)}
              onToggleFavorite={handleToggleFavorite}
              getModuleNameById={getModuleNameById}
            />
          </>
        )}
      </div>
      
      <DeleteJournalDialog
        isOpen={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};

export default JournalPage;