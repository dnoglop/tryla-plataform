import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    getPhaseById,
    getUserPhaseStatus,
    completePhase,
    Phase,
} from "@/services/moduleService";
import { Button } from "@/components/ui/button";
import {
    Play,
    Pause,
    ArrowLeft,
    CheckCircle2,
    Volume2,
    VolumeX,
} from "lucide-react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useReward } from "@/hooks/use-reward";
import { toast } from "sonner";

export default function PhaseDetailPage() {
    const { id, moduleId } = useParams<{ id: string; moduleId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const phaseId = parseInt(id || "0");
    const currentModuleId = parseInt(moduleId || "0");
    const [textContent, setTextContent] = useState<string | null>(null);
    const [speechRate, setSpeechRate] = useState(1.1);
    const [lastReadPosition, setLastReadPosition] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const { showReward } = useReward();
    const { isPlaying, playText, stopAudio } = useTextToSpeech();

    console.log("PhaseDetailPage rendering - Phase ID:", phaseId, "Module ID:", currentModuleId);

    const { data: phase, isLoading: isPhaseLoading, error: phaseError } = useQuery({
        queryKey: ["phase", phaseId],
        queryFn: async () => {
            console.log("Fetching phase:", phaseId);
            const phase = await getPhaseById(phaseId);
            console.log("Phase fetched:", phase);
            return phase;
        },
        enabled: !!phaseId,
    });

    const { data: user, isLoading: isUserLoading, error: userError } = useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                console.error("No authenticated user found");
                navigate("/login");
                throw new Error("Usuário não autenticado.");
            }
            console.log("User authenticated:", user.id);
            return user;
        },
    });

    const { data: status, isLoading: isStatusLoading, error: statusError } = useQuery({
        queryKey: ["phaseStatus", user?.id, phaseId],
        queryFn: async () => {
            if (!user?.id) return "notStarted";
            console.log("Fetching phase status for user:", user.id, "phase:", phaseId);
            const status = await getUserPhaseStatus(user.id, phaseId);
            console.log("Phase status:", status);
            return status;
        },
        enabled: !!user?.id && !!phaseId,
    });

    useEffect(() => {
        if (phase?.content) {
            setTextContent(phase.content);
        }
    }, [phase?.content]);

    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, [stopAudio]);

    const getTextFromPosition = (text: string, position: number): string => {
        const words = text.split(' ');
        return words.slice(position).join(' ');
    };

    const handleTextToSpeech = () => {
        console.log("Text-to-speech button clicked, isPlaying:", isPlaying);
        if (!textContent) {
            console.log("No text content available");
            return;
        }
        
        if (isPlaying) {
            console.log("Stopping audio");
            stopAudio();
            setIsPaused(true);
        } else {
            console.log("Starting audio with rate:", speechRate, "from position:", lastReadPosition);
            const cleanText = textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            
            // Se foi pausado, continua de onde parou, senão começa do início
            const textToRead = isPaused ? getTextFromPosition(cleanText, lastReadPosition) : cleanText;
            
            if (!isPaused) {
                setLastReadPosition(0);
            }
            
            playText(textToRead, { lang: 'pt-BR', rate: speechRate });
            setIsPaused(false);
        }
    };

    const handleSpeedChange = (newRate: number) => {
        console.log("Speed changed to:", newRate);
        setSpeechRate(newRate);
        if (isPlaying && textContent) {
            stopAudio();
            setTimeout(() => {
                const cleanText = textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                const textToRead = getTextFromPosition(cleanText, lastReadPosition);
                playText(textToRead, { lang: 'pt-BR', rate: newRate });
            }, 100);
        }
    };

    // Monitora quando o áudio termina para resetar a posição
    useEffect(() => {
        if (!isPlaying && !isPaused) {
            setLastReadPosition(0);
        }
    }, [isPlaying, isPaused]);

    const handleCompletePhase = async () => {
        if (!phase || !user) {
            console.error("Missing phase or user data");
            return;
        }
        
        try {
            console.log("Completing phase:", phase.id, "for user:", user.id);
            await completePhase(user.id, phase.id);
            
            const rewardData = {
                xp: 50,
                title: "Fase Concluída!",
                message: `Parabéns! Você completou a fase "${phase.name}".`,
                type: "phase_completion" as const
            };
            
            console.log("Showing reward modal:", rewardData);
            showReward(rewardData);
            
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["phaseStatus", user.id, phase.id] });
            queryClient.invalidateQueries({ queryKey: ["moduleProgress", user.id, phase.module_id] });
            queryClient.invalidateQueries({ queryKey: ["moduleDetailData", phase.module_id] });
            
            toast.success("Fase concluída com sucesso!");
            
            // Navigate back to module
            if (phase.module_id) {
                navigate(`/modulo/${phase.module_id}`);
            } else {
                navigate("/modulos");
            }
        } catch (error) {
            console.error("Erro ao completar fase:", error);
            toast.error("Erro ao completar a fase. Tente novamente.");
        }
    };

    const handleBackToModule = () => {
        console.log("Back button clicked");
        if (phase?.module_id || currentModuleId) {
            navigate(`/modulo/${phase?.module_id || currentModuleId}`);
        } else {
            navigate("/modulos");
        }
    };

    if (isPhaseLoading || isUserLoading || isStatusLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando fase...</p>
                </div>
            </div>
        );
    }

    if (phaseError || userError || statusError) {
        console.error("Component errors:", { phaseError, userError, statusError });
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive mb-4">Erro ao carregar a fase.</p>
                    <Button onClick={() => navigate("/modulos")}>
                        Voltar aos Módulos
                    </Button>
                </div>
            </div>
        );
    }

    if (!phase) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Fase não encontrada.</p>
                    <Button onClick={() => navigate("/modulos")}>
                        Voltar aos Módulos
                    </Button>
                </div>
            </div>
        );
    }

    console.log("Rendering phase detail page:", phase.name, "Status:", status);

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header com design limpo */}
            <header className="bg-card border-b shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToModule}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-foreground truncate">
                                {phase.name}
                            </h1>
                            {phase.description && (
                                <p className="text-sm text-muted-foreground truncate">
                                    {phase.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
                {/* Card principal do conteúdo */}
                <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-card-foreground">
                                {phase.name}
                            </h2>
                            {status === "completed" && (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="text-sm font-medium">Concluída</span>
                                </div>
                            )}
                        </div>
                        
                        {phase.description && (
                            <p className="text-muted-foreground mb-6">
                                {phase.description}
                            </p>
                        )}
                    </div>

                    {/* Conteúdo da fase */}
                    {phase.type === "text" && textContent && (
                        <div className="border-t">
                            {/* Controles de áudio */}
                            <div className="px-6 py-4 bg-muted/30 border-b">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-foreground">Conteúdo da Fase</h3>
                                    <div className="flex items-center gap-3">
                                        {/* Controles de velocidade */}
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm text-muted-foreground">Velocidade:</span>
                                            {[0.8, 1.0, 1.2, 1.5].map((rate) => (
                                                <button
                                                    key={rate}
                                                    onClick={() => handleSpeedChange(rate)}
                                                    className={`px-2 py-1 text-xs rounded transition-colors ${
                                                        speechRate === rate
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                                    }`}
                                                >
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {/* Botão de reprodução */}
                                        <Button
                                            onClick={handleTextToSpeech}
                                            size="sm"
                                            variant="outline"
                                            className="flex items-center gap-2"
                                        >
                                            {isPlaying ? (
                                                <Pause className="h-4 w-4" />
                                            ) : (
                                                <Play className="h-4 w-4" />
                                            )}
                                            {isPlaying ? "Pausar" : isPaused ? "Continuar" : "Ouvir"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Texto da fase */}
                            <div className="p-6">
                                <div 
                                    className="prose prose-lg max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: textContent }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Outros tipos de conteúdo */}
                    {phase.type === "video" && (
                        <div className="border-t p-6">
                            <h3 className="text-xl font-bold text-card-foreground mb-4">
                                Vídeo
                            </h3>
                            <p className="text-muted-foreground">
                                Assista ao vídeo para completar a fase.
                            </p>
                        </div>
                    )}

                    {phase.type === "quiz" && (
                        <div className="border-t p-6">
                            <h3 className="text-xl font-bold text-card-foreground mb-4">
                                Quiz
                            </h3>
                            <p className="text-muted-foreground">
                                Responda ao quiz para testar seus conhecimentos.
                            </p>
                        </div>
                    )}
                </div>

                {/* Botões de ação */}
                <div className="bg-card rounded-xl shadow-sm border p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                            {status === "completed" ? "Fase já concluída" : "Conclua esta fase para avançar"}
                        </div>
                        
                        {status !== "completed" && (
                            <Button
                                onClick={handleCompletePhase}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                size="lg"
                            >
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Concluir Fase
                            </Button>
                        )}
                    </div>
                </div>
            </main>
            
            <BottomNavigation />
        </div>
    );
}
