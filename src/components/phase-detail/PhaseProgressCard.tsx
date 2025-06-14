
import { Phase } from "@/services/moduleService";

interface PhaseProgressCardProps {
    phase: Phase;
    moduleProgress: number;
}

export const PhaseProgressCard = ({ phase, moduleProgress }: PhaseProgressCardProps) => {
    return (
        <div className="card-trilha p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                        {phase.name}
                    </h2>
                    {phase.description && (
                        <p className="text-muted-foreground mt-2 text-base">
                            {phase.description}
                        </p>
                    )}
                </div>

                {/* Gráfico circular de progresso */}
                <div className="flex-shrink-0">
                    <div className="relative flex items-center justify-center">
                        <svg
                            width={70}
                            height={70}
                            className="transform -rotate-90"
                        >
                            {/* Background circle */}
                            <circle
                                cx={35}
                                cy={35}
                                r={28}
                                stroke="hsl(var(--muted))"
                                strokeWidth={7}
                                fill="none"
                            />
                            {/* Progress circle */}
                            <circle
                                cx={35}
                                cy={35}
                                r={28}
                                stroke="hsl(var(--primary))"
                                strokeWidth={7}
                                fill="none"
                                strokeDasharray={175.9}
                                strokeDashoffset={
                                    175.9 -
                                    (moduleProgress / 100) * 175.9
                                }
                                strokeLinecap="round"
                                className="transition-all duration-500 ease-in-out"
                            />
                        </svg>
                        {/* Percentage text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-foreground">
                                {Math.round(moduleProgress)}%
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2 font-medium">
                        da meta concluída!
                    </p>
                </div>
            </div>
        </div>
    );
};
