
import React from 'react';
import { Heart, MoreVertical, Pencil, Trash, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { JournalEntry as JournalEntryType } from '@/services/journalService';

type JournalEntryProps = {
  entry: JournalEntryType;
  onEdit: (entry: JournalEntryType) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  moduleName?: string | null;
};

const JournalEntry: React.FC<JournalEntryProps> = ({
  entry,
  onEdit,
  onDelete,
  onToggleFavorite,
  moduleName
}) => {
  const formattedDate = entry.created_at 
    ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR })
    : '';

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="text-2xl">{entry.emoji || '📝'}</div>
          <h3 className="font-bold text-lg">{entry.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={entry.is_favorite ? "text-red-500" : "text-gray-400"}
            onClick={() => onToggleFavorite(entry.id!, !entry.is_favorite)}
          >
            <Heart className={`w-5 h-5 ${entry.is_favorite ? "fill-red-500" : ""}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(entry)}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-500"
                onClick={() => onDelete(entry.id!)}
              >
                <Trash className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {moduleName && (
        <div className="flex items-center gap-1 text-xs text-blue-600 mb-2 bg-blue-50 py-1 px-2 rounded-full inline-block">
          <BookOpen className="w-3 h-3" />
          <span>{moduleName}</span>
        </div>
      )}
      
      <p className="text-gray-700 whitespace-pre-line">{entry.content}</p>
      <div className="text-xs text-gray-500 mt-3">{formattedDate}</div>
    </div>
  );
};

export default JournalEntry;
