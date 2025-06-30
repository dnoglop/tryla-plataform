// ARQUIVO: components/QuizQuestion.tsx
// CÓDIGO COMPLETO E ATUALIZADO

import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";

interface QuizQuestionProps {
  question: string;
  options: string[];
  correctAnswer: number;
  tip: string | null;
  onCorrectAnswer: () => void; // Alterado para ser chamado apenas na resposta correta
  questionId?: number;
}

const QuizQuestion = ({
  question,
  options,
  correctAnswer,
  tip,
  onCorrectAnswer,
  questionId
}: QuizQuestionProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Para bloquear cliques durante a animação
  const [showHintButton, setShowHintButton] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Resetar estado quando a pergunta muda
    setSelectedOption(null);
    setShowFeedback(false);
    setIsLocked(false);
    setShowHintButton(false);
    setShowHint(false);
  }, [questionId]);

  if (!Array.isArray(options) || options.length === 0 || correctAnswer === undefined) {
    return <div>Erro ao carregar dados da pergunta.</div>;
  }

  const handleOptionClick = (index: number) => {
    if (isLocked) return; // Não faz nada se já estiver bloqueado

    setIsLocked(true);
    setSelectedOption(index);
    setShowFeedback(true);
    
    const isCorrect = index === correctAnswer;

    if (isCorrect) {
      // Esconde a dica caso o usuário acerte
      setShowHintButton(false);
      setShowHint(false);

      // (Item 2) Aumentar o tempo da animação para 3 segundos
      setTimeout(() => {
        // (Item 1) Avança apenas se a resposta for correta
        onCorrectAnswer();
        // O reset do estado acontecerá pelo useEffect quando a próxima pergunta carregar
      }, 3000);
    } else {
      // (Item 3) Se errar, mostra o botão de dica
      if (tip) { // Só mostra o botão se houver uma dica disponível
        setShowHintButton(true);
      }
      
      // Permite nova tentativa após 2 segundos
      setTimeout(() => {
        setIsLocked(false);
        setSelectedOption(null);
        setShowFeedback(false); // Esconde o GIF para não poluir a tela na nova tentativa
      }, 2000);
    }
  };

  const getFeedbackGif = (isCorrect: boolean) => {
    if (isCorrect) {
      const correctGifs = [
        "https://53.fs1.hubspotusercontent-na1.net/hub/53/hubfs/Brazil/Blog Images PT/O Facebook finalmente aceita GIFs 10 formas de comemorar/giph-brazil.gif?width=645&name=giph-brazil.gif",
        "https://i.gifer.com/E7Od.gif",
      ];
      return correctGifs[Math.floor(Math.random() * correctGifs.length)];
    } else {
      const incorrectGifs = [
        "https://pa1.aminoapps.com/6355/d569f1ffdf532c609a811f6fd415c947ac57cc08_00.gif",
        "https://i.imgflip.com/1a3qul.gif",
      ];
      return incorrectGifs[Math.floor(Math.random() * incorrectGifs.length)];
    }
  };

  return (
    <div className="animate-fade-in">
      <h3 className="mb-4 text-lg font-bold text-center">{question}</h3>

      <div className="space-y-3">
        {options.map((option, index) => (
          <button
            key={index}
            className={`w-full rounded-lg border p-4 text-left transition-all ${
              selectedOption === index
                ? selectedOption === correctAnswer
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
                : "border-gray-200 hover:border-trilha-orange hover:bg-trilha-orange/5"
            }`}
            onClick={() => handleOptionClick(index)}
            disabled={isLocked} // Desabilita o botão quando está bloqueado
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                  selectedOption === index
                    ? selectedOption === correctAnswer
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-red-500 bg-red-500 text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </div>
              <span>{option}</span>
            </div>
          </button>
        ))}
      </div>
      
      {/* Container para Dica e Feedback */}
      <div className="mt-6 space-y-4 text-center">
        {showFeedback && (
          <div>
            <div className="h-32 w-full overflow-hidden rounded-lg">
              <img
                src={getFeedbackGif(selectedOption === correctAnswer)}
                alt="Feedback"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-2 text-lg font-bold">
              {selectedOption === correctAnswer
                ? "Acertou 🎉 Vamos para a próxima!"
                : "Vish, não foi dessa vez. Tente de novo! 😅"}
            </p>
          </div>
        )}

        {showHintButton && !showHint && (
          <button
            onClick={() => setShowHint(true)}
            className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-200"
          >
            <Lightbulb className="h-4 w-4" />
            Quer uma dica? 👀
          </button>
        )}

        {showHint && tip && (
          <div className="rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 p-4 text-yellow-900">
            <p className="font-bold">Dica:</p>
            <p>{tip}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default QuizQuestion;