
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Phase } from "@/services/moduleService";

interface PhaseNavigationProps {
    previousPhase: Phase | null;
    nextPhase: Phase | null;
    phase: Phase;
    isSubmitting: boolean;
    quizCompleted: boolean;
    onNavigateToPrevious: () => void;
    onCompletePhase: () => void;
    onNavigateToNext: () => void;
}

export const PhaseNavigation = ({
    previousPhase,
    nextPhase,
    phase,
    isSubmitting,
    quizCompleted,
    onNavigateToPrevious,
    onCompletePhase,
    onNavigateToNext,
}: PhaseNavigationProps) => {
    return (
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-6">
            {/* Botão Voltar */}
            <Button
                onClick={onNavigateToPrevious}
                disabled={!previousPhase}
                variant="outline"
                className={`${!previousPhase ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
            </Button>

            {/* Botões de Ação centralizados */}
            <div className="flex gap-3">
                <Button
                    onClick={onCompletePhase}
                    disabled={isSubmitting || phase.type === "quiz"}
                    className={`btn-trilha ${phase.type === "quiz" ? "hidden" : ""}`}
                >
                    {isSubmitting
                        ? "Processando..."
                        : nextPhase
                          ? "Concluir e Próxima"
                          : "Finalizar Módulo"}{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                    onClick={onNavigateToNext}
                    disabled={!quizCompleted}
                    className={`btn-trilha ${phase.type !== "quiz" ? "hidden" : ""}`}
                >
                    {nextPhase ? "Próxima Fase" : "Finalizar Módulo"}{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
