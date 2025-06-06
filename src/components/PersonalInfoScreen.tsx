import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PersonalInfoScreenProps {
  onSubmit: (hobbies: string) => void;
}

export function PersonalInfoScreen({ onSubmit }: PersonalInfoScreenProps) {
  const [hobbies, setHobbies] = useState('');

  const handleSubmit = () => {
    if (hobbies.trim() === '') {
        alert('Por favor, conte um pouco sobre você para personalizarmos seu resultado!');
        return;
    }
    onSubmit(hobbies);
  };

  return (
    <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-md border border-slate-200/80 text-center">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">O Toque Final!</h2>
      <p className="text-slate-600 mb-6 max-w-lg mx-auto">
        Seus talentos são únicos. Agora, conte pra gente: o que te move? Fale sobre seus hobbies, valores ou paixões.
      </p>
      <Textarea
        value={hobbies}
        onChange={(e) => setHobbies(e.target.value)}
        rows={5}
        className="bg-slate-50 border-slate-200 focus:ring-orange-500"
        placeholder="Ex: Amo games de estratégia, maratonar séries, lutar por um mundo mais justo, desenhar, etc..."
      />
      <Button onClick={handleSubmit} className="mt-6 bg-orange-500 hover:bg-orange-600 text-lg px-12 py-6 shadow-lg w-full sm:w-auto">
        Ver meu Resultado
      </Button>
    </div>
  );
}