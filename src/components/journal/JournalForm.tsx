
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { JournalEntry } from '@/services/journalService';

type JournalFormProps = {
  entry?: JournalEntry | null;
  userId: string;
  onSubmit: (entry: JournalEntry) => void;
  onCancel: () => void;
};

const EMOJIS = ["📝", "🚀", "🧠", "💡", "🎯", "🌱", "🤔", "🎉", "📚", "🧐", "💪", "❤️", "🌟"];

const JournalForm: React.FC<JournalFormProps> = ({
  entry,
  userId,
  onSubmit,
  onCancel
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Preencher o formulário se estiver editando uma entrada existente
  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setContent(entry.content || '');
      setEmoji(entry.emoji || '📝');
    }
  }, [entry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const journalEntry: JournalEntry = {
      id: entry?.id,
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
      emoji,
      is_favorite: entry?.is_favorite || false
    };
    
    onSubmit(journalEntry);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">
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
              className="text-2xl p-2 h-10 w-10 flex items-center justify-center border rounded-md"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              {emoji}
            </button>
            
            {showEmojiPicker && (
              <div className="absolute top-12 left-0 bg-white border rounded-lg shadow-lg p-2 z-50">
                <div className="grid grid-cols-5 gap-1">
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      type="button"
                      className="text-xl p-1 hover:bg-gray-100 rounded"
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
          <Button type="submit" className="bg-trilha-orange hover:bg-amber-600">
            {entry ? 'Salvar alterações' : 'Criar anotação'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JournalForm;
