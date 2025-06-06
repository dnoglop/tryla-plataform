interface StartScreenProps {
    onStart: () => void;
  }
  
  export function StartScreen({ onStart }: StartScreenProps) {
    return (
      <div className="glass-card p-6 md:p-14 rounded-3xl text-center animate-fadeIn">
        <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-4">Missão: Autoconhecimento</h1>
        <p className="text-slate-600 mb-6 text-1xl">Você está prestes a embarcar em uma jornada para descobrir
          seus superpoderes profissionais. Cada resposta te deixará mais perto de encontrar o seu caminho. Preparado(a)?</p>
        <button onClick={onStart} className="btn-primary bg-orange-500 text-white font-bold text-lg px-12 py-4 rounded-xl shadow-lg">
          Começar a Missão
        </button>
      </div>
    );
  }