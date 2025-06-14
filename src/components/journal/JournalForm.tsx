
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { JournalEntry } from '@/services/journalService';
import { useQuery } from '@tanstack/react-query';
import { getModules, Module } from '@/services/moduleService';

type JournalFormProps = {
  entry?: JournalEntry | null;
  userId: string;
  onSubmit: (entry: JournalEntry) => void;
  onCancel: () => void;
  currentModuleId?: number | null;
};

const EMOJIS = ["📝", "🚀", "🧠", "💡", "🎯", "🌱", "🤔", "🎉", "📚", "🧐", "💪", "❤️", "🌟"];

const JournalForm: React.FC<JournalFormProps> = ({
  entry,
  userId,
  onSubmit,
  onCancel,
  currentModuleId = null
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [moduleId, setModuleId] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Buscar módulos
  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules
  });
  
  // Preencher o formulário se estiver editando uma entrada existente
  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setContent(entry.content || '');
      setEmoji(entry.emoji || '📝');
      setModuleId(entry.module_id || null);
    } else if (currentModuleId) {
      setModuleId(currentModuleId);
    }
  }, [entry, currentModuleId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const journalEntry: JournalEntry = {
      id: entry?.id,
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
      emoji,
      module_id: moduleId,
      is_favorite: entry?.is_favorite || false
    };
    
    onSubmit(journalEntry);
  };

  return (
    <div className="bg-card rounded-lg shadow border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-foreground">
          {entry ? 'Editar anotação' : 'Nova anotação'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="relative">
            <button
              type="button"
              className="text-2xl p-2 h-10 w-10 flex items-center justify-center border border-border rounded-md bg-background hover:bg-accent"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              {emoji}
            </button>
            
            {showEmojiPicker && (
              <div className="absolute top-12 left-0 bg-card border border-border rounded-lg shadow-lg p-2 z-50">
                <div className="grid grid-cols-5 gap-1">
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      type="button"
                      className="text-xl p-1 hover:bg-accent rounded"
                      onClick={() => {
                        setEmoji(e);
                        setShowEmojiPicker(false);
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Input
            placeholder="Título da anotação"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="flex-1"
          />
        </div>
        
        <div>
          <label htmlFor="module" className="block text-sm mb-1 text-muted-foreground">
            Relacionar com módulo (opcional)
          </label>
          <Select value={moduleId?.toString() || ''} onValueChange={(value) => setModuleId(value ? parseInt(value) : null)}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um módulo (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">Nenhum módulo</SelectItem>
              {modules.map((module: Module) => (
                <SelectItem key={module.id} value={module.id.toString()}>
                  {module.emoji || '📚'} {module.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Textarea
          placeholder="O que você aprendeu hoje?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={5}
          className="resize-none"
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {entry ? 'Salvar alterações' : 'Criar anotação'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JournalForm;
