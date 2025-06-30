// ARQUIVO: src/components/phase-detail/QuizContent.tsx (VERSÃO CORRIGIDA E COMPLETA)

import React from 'react';
import { CheckCircle } from 'lucide-react';
import QuizQuestion from '../QuizQuestion'; 
import { formatTime } from '@/lib/formatters';

interface QuizContentProps {
  questions: any[];
  currentQuestionIndex: number;
  quizCompleted: boolean;
  quizStartTime: number | null;
  quizElapsedTime: number | null;
  currentQuestion: any;
  onCorrectAnswer: () => void;
}

export const QuizContent: React.FC<QuizContentProps> = ({
  questions,
  currentQuestionIndex,
  quizCompleted,
  quizElapsedTime,
  onCorrectAnswer,
}) => {
  
  // A tela de "Quiz Finalizado" é renderizada quando o estado `quizCompleted` é verdadeiro.
  if (quizCompleted) {
    return (
      <div className="text-center p-6 sm:p-8 bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/30 rounded-lg animate-in fade-in-50 duration-500">
        <CheckCircle className="mx-auto h-12 w-12 text-orange-500" />
        <h2 className="mt-4 text-2xl font-bold">Quiz Finalizado!</h2>
        
        {/* CORREÇÃO: Usando a função formatTime no quizElapsedTime */}
        <p className="mt-2 text-lg text-muted-foreground">
          Seu tempo final: <span className="font-bold text-orange-600">{formatTime(quizElapsedTime || 0)}</span>
        </p>

        <p className="mt-4 text-sm text-muted-foreground">
          Você já pode avançar para a próxima fase.
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return <div className="text-center p-8">Carregando pergunta...</div>;
  }

  return (
    <div className="card-trilha p-6">
      <div className="mb-4 flex justify-between text-sm text-muted-foreground">
        <span>Pergunta {currentQuestionIndex + 1} de {questions.length}</span>
      </div>
      <QuizQuestion
        key={currentQuestion.id}
        questionId={currentQuestion.id}
        question={currentQuestion.question}
        options={currentQuestion.options}
        correctAnswer={currentQuestion.correct_answer}
        tip={currentQuestion.tips_question}
        onCorrectAnswer={onCorrectAnswer}
      />
    </div>
  );
};