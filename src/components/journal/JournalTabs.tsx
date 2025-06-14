
import React from 'react';
import { ClipboardList, Star } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { JournalEntry } from '@/services/journalService';
import JournalEntryComponent from '@/components/journal/JournalEntry';
import EmptyJournal from '@/components/journal/EmptyJournal';

type JournalTabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  entries: JournalEntry[];
  filteredEntries: JournalEntry[];
  onNewEntry: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  getModuleNameById: (id: number | null | undefined) => string | null;
};

const JournalTabs: React.FC<JournalTabsProps> = ({
  activeTab,
  setActiveTab,
  entries,
  filteredEntries,
  onNewEntry,
  onEdit,
  onDelete,
  onToggleFavorite,
  getModuleNameById
}) => {
  return (
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
          <EmptyJournal onNewEntry={onNewEntry} />
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma anotação encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map(entry => (
              <JournalEntryComponent
                key={entry.id}
                entry={entry}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
                moduleName={getModuleNameById(entry.module_id)}
              />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="favorites" className="mt-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma anotação favorita
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map(entry => (
              <JournalEntryComponent
                key={entry.id}
                entry={entry}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
                moduleName={getModuleNameById(entry.module_id)}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default JournalTabs;
