
import { Button } from "@/components/ui/button";
import { Volume2, Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface AudioControlsProps {
    isPlaying: boolean;
    isPaused: boolean;
    isLoadingAudio: boolean;
    speechRate: number;
    onReadContent: () => void;
    onSpeedChange: () => void;
    onResetAudio: () => void;
}

export const AudioControls = ({
    isPlaying,
    isPaused,
    isLoadingAudio,
    speechRate,
    onReadContent,
    onSpeedChange,
    onResetAudio,
}: AudioControlsProps) => {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 p-3 bg-accent rounded-lg">
            <div className="text-xs text-muted-foreground order-1 sm:order-none">
                Áudio:
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto order-2 sm:order-none">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onReadContent}
                    disabled={isLoadingAudio}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none min-w-0"
                >
                    {isPlaying ? (
                        <Pause className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
                    ) : isPaused ? (
                        <Play className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
                    ) : (
                        <Volume2 className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="hidden sm:inline">
                        {isPlaying ? "Pausar" : isPaused ? "Continuar" : "Ouvir Texto"}
                    </span>
                    <span className="sm:hidden">
                        {isPlaying ? "Pausar" : isPaused ? "▶" : "🔊"}
                    </span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onSpeedChange}
                    className="min-w-[50px] flex-shrink-0"
                >
                    {speechRate.toFixed(2)}x
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetAudio}
                    disabled={!isPaused && !isPlaying}
                    className="flex-shrink-0"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
