
import { ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Module } from "@/services/moduleService";

interface NextModuleCardProps {
    nextModule: Module;
    onContinue: () => void;
    onBackToModules: () => void;
}

export const NextModuleCard = ({
    nextModule,
    onContinue,
    onBackToModules,
}: NextModuleCardProps) => (
    <div className="mt-6 p-6 bg-gradient-to-r from-accent to-accent/80 rounded-2xl border border-border">
        <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-primary/20 text-2xl">
                {nextModule.emoji || "📚"}
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">
                    Próxima Missão
                </h3>
                <h4 className="text-xl font-semibold text-primary mb-2">
                    {nextModule.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                    {nextModule.description}
                </p>
            </div>
        </div>
        <div className="flex gap-3">
            <Button
                onClick={onContinue}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
                Seguir para o Próximo Módulo
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
                onClick={onBackToModules}
                variant="outline"
                className="border-border text-foreground hover:bg-accent"
            >
                <Home className="mr-2 h-4 w-4" />
                Voltar para as Trilhas
            </Button>
        </div>
    </div>
);
