
import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

type JournalHeaderProps = {
  onNewEntry: () => void;
};

const JournalHeader: React.FC<JournalHeaderProps> = ({ onNewEntry }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white p-4 border-b flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate('/perfil')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg ml-2">Diário de Aprendizado</h1>
      </div>
      <Button 
        onClick={onNewEntry}
        size="sm"
        className="bg-trilha-orange hover:bg-amber-600"
      >
        <Plus className="h-4 w-4 mr-1" /> Nova
      </Button>
    </header>
  );
};

export default JournalHeader;
