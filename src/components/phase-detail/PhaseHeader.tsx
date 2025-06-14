
import { ArrowLeft, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Module } from "@/services/moduleService";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/navigation/ProgressIndicator";
import { NavigationBottomSheet } from "@/components/navigation/NavigationBottomSheet";

interface PhaseHeaderProps {
    module: Module;
    moduleId: string;
    currentPhaseIndex: number;
    totalPhases: number;
    onShowNavigation?: () => void;
}

export const PhaseHeader = ({ 
    module, 
    moduleId, 
    currentPhaseIndex, 
    totalPhases,
    onShowNavigation 
}: PhaseHeaderProps) => {
    const navigate = useNavigate();

    // Mock data para o bottom sheet - em um app real, isso viria das props
    const mockPhases = Array.from({ length: totalPhases }, (_, i) => ({
        id: i + 1,
        name: `Fase ${i + 1}`,
        type: 'conteúdo',
        isCompleted: i < currentPhaseIndex,
        isLocked: i > currentPhaseIndex + 1,
        isCurrent: i === currentPhaseIndex
    }));

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
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-sm text-white/80">
                                    Fase {currentPhaseIndex + 1} de {totalPhases}
                                </p>
                                <ProgressIndicator
                                    currentStep={currentPhaseIndex}
                                    totalSteps={totalPhases}
                                    variant="dots"
                                    className="hidden sm:flex"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Botão para abrir navegação contextual */}
                    <NavigationBottomSheet
                        module={{
                            id: parseInt(moduleId),
                            name: module.name,
                            progress: ((currentPhaseIndex + 1) / totalPhases) * 100
                        }}
                        phases={mockPhases}
                        onPhaseClick={(phaseId) => navigate(`/modulo/${moduleId}/fase/${phaseId}`)}
                        onContinue={() => {
                            const nextPhase = currentPhaseIndex + 1;
                            if (nextPhase < totalPhases) {
                                navigate(`/modulo/${moduleId}/fase/${nextPhase + 1}`);
                            }
                        }}
                    >
                        <Button
                            size="icon"
                            className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0"
                        >
                            <Menu className="h-4 w-4 text-white" />
                        </Button>
                    </NavigationBottomSheet>
                </div>
                
                {/* Indicador de progresso mobile */}
                <div className="mt-3 sm:hidden">
                    <ProgressIndicator
                        currentStep={currentPhaseIndex}
                        totalSteps={totalPhases}
                        variant="line"
                    />
                </div>
            </div>
        </header>
    );
};
