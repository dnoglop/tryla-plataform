
import { Clock } from "lucide-react";
import QuizQuestion from "@/components/QuizQuestion";
import { Question } from "@/services/moduleService";

interface QuizContentProps {
    questions: Question[];
    currentQuestionIndex: number;
    quizCompleted: boolean;
    quizStartTime: number | null;
    quizElapsedTime: number | null;
    currentQuestion: Question;
    onCorrectAnswer: () => void;
}

const formatTime = (s: number | null) =>
    s === null
        ? "00:00"
        : `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export const QuizContent = ({
    questions,
    currentQuestionIndex,
    quizCompleted,
    quizStartTime,
    quizElapsedTime,
    currentQuestion,
    onCorrectAnswer,
}: QuizContentProps) => {
    return (
        <div className="card-trilha p-6">
            {questions.length > 0 && !quizCompleted && currentQuestion && (
                <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-4">
                        <span>
                            Pergunta {currentQuestionIndex + 1} de {questions.length}
                        </span>
                        {quizStartTime && (
                            <span className="text-primary flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(
                                    Math.round((Date.now() - quizStartTime) / 1000)
                                )}
                            </span>
                        )}
                    </div>
                    <div className="progress-bar mb-6">
                        <div
                            className="progress-value"
                            style={{
                                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                            }}
                        ></div>
                    </div>
                    <QuizQuestion
                        key={currentQuestion.id}
                        questionId={currentQuestion.id}
                        question={currentQuestion.question}
                        options={
                            Array.isArray(currentQuestion.options)
                                ? currentQuestion.options
                                : []
                        }
                        correctAnswer={currentQuestion.correct_answer}
                        tip={currentQuestion.tips_question || null}
                        onCorrectAnswer={onCorrectAnswer}
                    />
                </div>
            )}
            {quizCompleted && (
                <div className="p-6 text-center bg-accent rounded-lg">
                    <h4 className="text-2xl font-bold text-foreground mb-3">
                        Quiz Finalizado!
                    </h4>
                    <div className="flex items-center justify-center gap-2 text-lg text-foreground">
                        <Clock className="h-6 w-6 text-primary" />
                        <span>Tempo final:</span>
                        <span className="font-bold text-primary text-xl">
                            {formatTime(quizElapsedTime)}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Você já pode avançar para a próxima fase.
                    </p>
                </div>
            )}
        </div>
    );
};
