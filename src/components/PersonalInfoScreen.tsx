
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
    <div className="bg-card p-6 sm:p-10 rounded-2xl shadow-md border border-border text-center">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">O Toque Final!</h2>
      <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
        Seus talentos são únicos. Agora, conte pra gente: o que te move? Fale sobre seus hobbies, valores ou paixões.
      </p>
      <Textarea
        value={hobbies}
        onChange={(e) => setHobbies(e.target.value)}
        rows={5}
        className="bg-background border-border focus:ring-primary"
        placeholder="Ex: Amo games de estratégia, maratonar séries, lutar por um mundo mais justo, desenhar, etc..."
      />
      <Button onClick={handleSubmit} className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-12 py-6 shadow-lg w-full sm:w-auto">
        Ver meu Resultado
      </Button>
    </div>
  );
}
