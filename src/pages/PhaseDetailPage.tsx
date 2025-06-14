
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
} from "lucide-react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useReward } from "@/hooks/use-reward";
import { toast } from "sonner";

interface RewardData {
    xp: number;
    title: string;
    message: string;
    type: "phase_completion" | "daily_task" | "module_completion";
}

export default function PhaseDetailPage() {
    const { id, moduleId } = useParams<{ id: string; moduleId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const phaseId = parseInt(id || "0");
    const currentModuleId = parseInt(moduleId || "0");
    const [textContent, setTextContent] = useState<string | null>(null);
    const [speechRate, setSpeechRate] = useState(1.1);
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

    const handleTextToSpeech = () => {
        console.log("Text-to-speech button clicked, isPlaying:", isPlaying);
        if (!textContent) {
            console.log("No text content available");
            return;
        }
        
        if (isPlaying) {
            console.log("Stopping audio");
            stopAudio();
        } else {
            console.log("Starting audio with rate:", speechRate);
            const cleanText = textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            playText(cleanText, { lang: 'pt-BR', rate: speechRate });
        }
    };

    const handleSpeedChange = (newRate: number) => {
        console.log("Speed changed to:", newRate);
        setSpeechRate(newRate);
        if (isPlaying && textContent) {
            stopAudio();
            setTimeout(() => {
                const cleanText = textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                playText(cleanText, { lang: 'pt-BR', rate: newRate });
            }, 100);
        }
    };

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
            <header className="p-4 sm:p-6 border-b">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">
                            {phase.name}
                        </h1>
                        <p className="text-muted-foreground">
                            {phase.description || "Sem descrição."}
                        </p>
                    </div>
                </div>
            </header>
            
            <main className="container px-4 py-6 space-y-6">
                <div className="bg-card p-6 rounded-2xl shadow-sm border space-y-4">
                    <h2 className="text-2xl font-bold text-card-foreground">
                        {phase.name}
                    </h2>
                    <p className="text-muted-foreground">
                        {phase.description || "Sem descrição."}
                    </p>
                </div>

                {phase.type === "text" && (
                    <div className="bg-card p-6 rounded-2xl shadow-sm border space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <h3 className="text-xl font-bold text-card-foreground">
                                Conteúdo da Fase
                            </h3>
                            {textContent && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <span>Velocidade:</span>
                                        <button
                                            onClick={() => handleSpeedChange(0.8)}
                                            className={`px-2 py-1 rounded text-xs ${speechRate === 0.8 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                        >
                                            0.8x
                                        </button>
                                        <button
                                            onClick={() => handleSpeedChange(1.0)}
                                            className={`px-2 py-1 rounded text-xs ${speechRate === 1.0 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                        >
                                            1.0x
                                        </button>
                                        <button
                                            onClick={() => handleSpeedChange(1.2)}
                                            className={`px-2 py-1 rounded text-xs ${speechRate === 1.2 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                        >
                                            1.2x
                                        </button>
                                        <button
                                            onClick={() => handleSpeedChange(1.5)}
                                            className={`px-2 py-1 rounded text-xs ${speechRate === 1.5 ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                        >
                                            1.5x
                                        </button>
                                    </div>
                                    <Button
                                        onClick={handleTextToSpeech}
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2"
                                    >
                                        {isPlaying ? (
                                            <Pause className="h-4 w-4" />
                                        ) : (
                                            <Play className="h-4 w-4" />
                                        )}
                                        {isPlaying ? "Pausar" : "Ouvir"}
                                    </Button>
                                </div>
                            )}
                        </div>
                        
                        {textContent ? (
                            <div 
                                className="prose prose-lg max-w-none text-card-foreground"
                                dangerouslySetInnerHTML={{ __html: textContent }}
                            />
                        ) : (
                            <p className="text-muted-foreground">
                                Conteúdo não disponível.
                            </p>
                        )}
                    </div>
                )}

                {phase.type === "video" && (
                    <div className="bg-card p-6 rounded-2xl shadow-sm border space-y-4">
                        <h3 className="text-xl font-bold text-card-foreground">
                            Vídeo
                        </h3>
                        <p className="text-muted-foreground">
                            Assista ao vídeo para completar a fase.
                        </p>
                    </div>
                )}

                {phase.type === "quiz" && (
                    <div className="bg-card p-6 rounded-2xl shadow-sm border space-y-4">
                        <h3 className="text-xl font-bold text-card-foreground">
                            Quiz
                        </h3>
                        <p className="text-muted-foreground">
                            Responda ao quiz para testar seus conhecimentos.
                        </p>
                    </div>
                )}

                {/* Seção de Navegação e Ações */}
                <div className="bg-card p-6 rounded-2xl shadow-sm border">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Button
                            onClick={handleBackToModule}
                            variant="outline"
                            className="flex items-center gap-2 w-full sm:w-auto"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar ao Módulo
                        </Button>
                        
                        {status !== "completed" && (
                            <Button
                                onClick={handleCompletePhase}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full sm:w-auto"
                                size="lg"
                            >
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Concluir Fase
                            </Button>
                        )}

                        {status === "completed" && (
                            <div className="flex items-center gap-2 text-green-600 w-full sm:w-auto justify-center">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-semibold">Fase Concluída!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Seção de Navegação Entre Fases */}
                <div className="bg-card p-4 rounded-2xl shadow-sm border">
                    <div className="flex justify-between items-center">
                        <Button
                            variant="ghost"
                            className="text-sm"
                            onClick={() => {
                                // Aqui você pode implementar navegação para fase anterior
                                console.log("Navigate to previous phase");
                            }}
                        >
                            ← Fase Anterior
                        </Button>
                        
                        <span className="text-sm text-muted-foreground">
                            Fase {phase.order_index || 1}
                        </span>
                        
                        <Button
                            variant="ghost"
                            className="text-sm"
                            onClick={() => {
                                // Aqui você pode implementar navegação para próxima fase
                                console.log("Navigate to next phase");
                            }}
                        >
                            Próxima Fase →
                        </Button>
                    </div>
                </div>
            </main>
            
            <BottomNavigation />
        </div>
    );
}
