
interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="bg-card p-6 md:p-14 rounded-3xl border shadow-lg text-center animate-fadeIn">
      <h1 className="text-2xl md:text-4xl font-extrabold text-foreground mb-4">
        Missão: Autoconhecimento
      </h1>
      <p className="text-muted-foreground mb-6 text-lg">
        Você está prestes a embarcar em uma jornada para descobrir seus superpoderes profissionais. 
        Cada resposta te deixará mais perto de encontrar o seu caminho. Preparado(a)?
      </p>
      <button 
        onClick={onStart} 
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-12 py-4 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        Começar a Missão
      </button>
    </div>
  );
}
