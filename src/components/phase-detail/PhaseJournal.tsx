import React from 'react';
import { Sparkles, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PhaseJournalProps {
  journalNotes: string;
  setJournalNotes: (notes: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export const PhaseJournal: React.FC<PhaseJournalProps> = ({ 
  journalNotes, 
  setJournalNotes, 
  onSave, 
  isSaving 
}) => {
  return (
    <div className="card-trilha p-6 space-y-4 my-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-bold text-foreground">Meu Diário de Bordo</h3>
      </div>
      <p className="text-muted-foreground">
        O que mais te marcou nesta fase? Anote seus insights, ideias ou sentimentos.
        Sua anotação será salva no seu Diário de Aprendizado.
      </p>
      
      <div>
        <Label htmlFor="journal-notes" className="sr-only">Anotações do diário</Label>
        <Textarea
          id="journal-notes"
          placeholder="Ex: 'Entendi que a empatia não é só sentir pelo outro, mas agir...'"
          value={journalNotes}
          onChange={(e) => setJournalNotes(e.target.value)}
          className="min-h-[120px] bg-background"
          rows={5}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={isSaving || !journalNotes.trim()}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Anotação no Diário"}
        </Button>
      </div>
    </div>
  );
};