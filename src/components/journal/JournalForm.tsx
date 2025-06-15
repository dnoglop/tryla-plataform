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
  onSubmit: (entryData: Omit<JournalEntry, 'id'>) => void;
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
  
  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: getModules
  });
  
  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setContent(entry.content || '');
      setEmoji(entry.emoji || '📝');
      setModuleId(entry.module_id || null);
    } else {
      setTitle('');
      setContent('');
      setEmoji('📝');
      setModuleId(currentModuleId);
    }
  }, [entry, currentModuleId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
        alert("Título e conteúdo são obrigatórios.");
        return;
    }
    
    const journalData = {
      id: entry?.id, 
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
      emoji,
      module_id: moduleId,
      phase_id: entry?.phase_id || null,
      is_favorite: entry?.is_favorite || false,
    };
    
    onSubmit(journalData);
  };

  return (
    <div className="bg-card rounded-lg shadow border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-foreground">
          {entry ? 'Editar anotação' : 'Nova anotação'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 w-5" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          {/* ...código do emoji picker... */}
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
          {/* --- CORREÇÃO DO SELECT --- */}
          <Select 
            value={moduleId?.toString() || "null-value"} // Usa um valor padrão se for nulo
            onValueChange={(value) => setModuleId(value === "null-value" ? null : parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Escolha um módulo (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {/* Usa um valor não-vazio para a opção nula */}
              <SelectItem value="null-value">Nenhum módulo</SelectItem>
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