
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
        <div className="flex justify-end items-center gap-3 mb-6 p-3 bg-accent rounded-lg">
            <div className="text-xs text-muted-foreground">
                Áudio:
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={onReadContent}
                disabled={isLoadingAudio}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
                {isPlaying ? (
                    <Pause className="mr-2 h-4 w-4" />
                ) : isPaused ? (
                    <Play className="mr-2 h-4 w-4" />
                ) : (
                    <Volume2 className="mr-2 h-4 w-4" />
                )}
                {isPlaying ? "Pausar" : isPaused ? "Continuar" : "Ouvir Texto"}
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onSpeedChange}
                className="min-w-[60px]"
            >
                {speechRate.toFixed(2)}x
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onResetAudio}
                disabled={!isPaused && !isPlaying}
            >
                <RotateCcw className="h-4 w-4" />
            </Button>
        </div>
    );
};
