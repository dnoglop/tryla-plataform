
import React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';

type EmptyJournalProps = {
  onNewEntry: () => void;
};

const EmptyJournal: React.FC<EmptyJournalProps> = ({ onNewEntry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
      <div className="text-4xl">📝</div>
      <h3 className="text-xl font-bold">Seu diário está vazio</h3>
      <p className="text-gray-600">
        Este é um espaço bem gostoso para anotar os seus aprendizados, reflexões
        e insights da sua jornada de desenvolvimento pessoal.
      </p>
      <Button 
        onClick={onNewEntry}
        className="mt-6 bg-trilha-orange hover:bg-amber-600"
      >
        <PlusCircle className="mr-2 h-5 w-5" />
        Criar primeira anotação
      </Button>
    </div>
  );
};

export default EmptyJournal;
