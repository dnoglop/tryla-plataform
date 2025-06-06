import { Question } from '../data/questions';
import { Button } from "@/components/ui/button"; // Usando seu componente de botão
import { Progress } from "@/components/ui/progress"; // Usando seu componente de progresso

interface QuizScreenProps {
  question: Question;
  onAnswer: (value: number) => void;
  progress: number;
}

export function QuizScreen({ question, onAnswer, progress }: QuizScreenProps) {
  return (
    <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-md border border-slate-200/80">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 min-h-[6rem] mb-8">
          {question.text}
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => onAnswer(3)} className="bg-green-500 hover:bg-green-600 shadow-lg w-full sm:w-auto">Tudo a ver</Button>
          <Button onClick={() => onAnswer(2)} className="bg-orange-500 hover:bg-orange-600 shadow-lg w-full sm:w-auto">Um pouco</Button>
          <Button onClick={() => onAnswer(1)} className="bg-slate-400 hover:bg-slate-500 shadow-lg w-full sm:w-auto">Nada a ver</Button>
        </div>
      </div>
      <div className="mt-10">
        <Progress value={progress} className="h-2 bg-slate-200 [&>*]:bg-orange-500" />
        <p className="text-center text-sm text-slate-500 mt-2">
          Missão {Math.round(progress)}% concluída
        </p>
      </div>
    </div>
  );
}