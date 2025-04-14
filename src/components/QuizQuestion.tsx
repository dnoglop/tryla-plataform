
import { useState } from "react";

interface QuizQuestionProps {
  question: string;
  options: string[];
  correctAnswer: number;
  onAnswer: (correct: boolean) => void;
  questionId?: number; // Added to help with debugging
}

const QuizQuestion = ({
  question,
  options,
  correctAnswer,
  onAnswer,
  questionId
}: QuizQuestionProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  console.log(`Rendering question "${question}" (ID: ${questionId}) with correct answer: ${correctAnswer} and options:`, options);

  const handleOptionClick = (index: number) => {
    if (selectedOption !== null || showFeedback) return;
    
    setSelectedOption(index);
    setShowFeedback(true);
    
    const isCorrect = index === correctAnswer;
    console.log(`User selected option ${index}, correct answer is ${correctAnswer}, isCorrect: ${isCorrect}`);
    
    setTimeout(() => {
      onAnswer(isCorrect);
      setSelectedOption(null);
      setShowFeedback(false);
    }, 1500);
  };

  const getFeedbackGif = (isCorrect: boolean) => {
    if (isCorrect) {
      const correctGifs = [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmNlNjI2M2NkNzZkNTQ3ZWMyMDYxMmNjNDFmYzYxYzM4MTIyMjAyYiZjdD1n/jsGnoQK22wKlkKaFoU/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWI3NWE5NTgyZTcxZTYyMGU0MjYzMTk5ZTA3MTlkYjA4YzZkNDI0YiZjdD1n/ynRrAHj5UP7Qmt2wDB/giphy.gif",
      ];
      return correctGifs[Math.floor(Math.random() * correctGifs.length)];
    } else {
      const incorrectGifs = [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTk0ZDk1MzE3MmVhNGYwMGMyOGU4MThlMjQ2OTIyNzdhMzBjZDlkMyZjdD1n/3oEjI4sFlp73fvEYgw/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTE0NjBiNGI3YjE3OWI4YTcyY2Q0M2JlMTkwNjY1ZTI0YWMzYzFiZiZjdD1n/l1J9FvIfnSUUUY9mo/giphy.gif",
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
            disabled={showFeedback}
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

      {showFeedback && (
        <div className="mt-6 text-center">
          <div className="h-32 w-full overflow-hidden rounded-lg">
            <img
              src={getFeedbackGif(selectedOption === correctAnswer)}
              alt="Feedback"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-2 text-lg font-bold">
            {selectedOption === correctAnswer
              ? "Acertou! 🔥 Você é fera!"
              : "Opa, não foi dessa vez 😅"}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;
