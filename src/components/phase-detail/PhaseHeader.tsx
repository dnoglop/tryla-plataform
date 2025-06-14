
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Module } from "@/services/moduleService";

interface PhaseHeaderProps {
    module: Module;
    moduleId: string;
    currentPhaseIndex: number;
    totalPhases: number;
}

export const PhaseHeader = ({ module, moduleId, currentPhaseIndex, totalPhases }: PhaseHeaderProps) => {
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
            <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/modulo/${moduleId}`)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md transition-transform hover:scale-110 active:scale-95 border border-border"
                        >
                            <ArrowLeft className="h-5 w-5 text-foreground" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground truncate">
                                {module.name}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Fase {currentPhaseIndex + 1} de {totalPhases}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
