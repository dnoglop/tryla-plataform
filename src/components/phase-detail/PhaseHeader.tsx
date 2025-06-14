
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Module } from "@/services/moduleService";

interface PhaseHeaderProps {
    module: Module;
    moduleId: string;
    currentPhaseIndex: number;
    totalPhases: number;
}

export const PhaseHeader = ({ 
    module, 
    moduleId, 
    currentPhaseIndex, 
    totalPhases
}: PhaseHeaderProps) => {
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-50 bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg backdrop-blur-sm">
            <div className="px-4 py-4">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/modulo/${moduleId}`)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-200 hover:bg-white/30 active:scale-95"
                        >
                            <ArrowLeft className="h-4 w-4 text-white" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-white truncate">
                                {module.name}
                            </h1>
                            <p className="text-sm text-white/80">
                                Fase {currentPhaseIndex + 1} de {totalPhases}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
