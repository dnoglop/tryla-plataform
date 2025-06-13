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
import { getProfile } from "@/services/profileService";
import { Button } from "@/components/ui/button";
import {
    Play,
    Pause,
    ArrowLeft,
    CheckCircle2,
} from "lucide-react";
import { speak } from 'tts-speak';
import { useReward } from "@/hooks/use-reward";
import { toast } from "sonner";

interface RewardData {
    xp: number;
    title: string;
    message: string;
    type: "phase_completion" | "daily_task" | "module_completion";
}

export default function PhaseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const phaseId = parseInt(id || "0");
    const [textContent, setTextContent] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const { showReward } = useReward();

    const { data: phase, isLoading: isPhaseLoading, error: phaseError } = useQuery({
        queryKey: ["phase", phaseId],
        queryFn: () => getPhaseById(phaseId),
        enabled: !!phaseId,
    });

    const { data: user, isLoading: isUserLoading, error: userError } = useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                navigate("/login");
                throw new Error("Usuário não autenticado.");
            }
            return user;
        },
    });

    const { data: status, isLoading: isStatusLoading, error: statusError } = useQuery({
        queryKey: ["phaseStatus", user?.id, phaseId],
        queryFn: () => getUserPhaseStatus(user?.id, phaseId),
        enabled: !!user?.id && !!phaseId,
    });

    useEffect(() => {
        if (phase?.content) {
            setTextContent(phase.content);
        }
    }, [phase?.content]);

    useEffect(() => {
        speak.onstart(() => setIsSpeaking(true));
        speak.onend(() => setIsSpeaking(false));

        return () => {
            speak.stop();
            speak.cancel();
        };
    }, []);

    const handleTextToSpeech = () => {
        if (!textContent) return;
        
        const options = {
            text: textContent,
            rate: 1,
            pitch: 1,
            volume: 1
        };
        
        speak(options);
    };

    const handleCompletePhase = async () => {
        if (!phase || !user) return;
        
        try {
            await completePhase(user.id, phase.id);
            
            const rewardData = {
                xp: 50,
                title: "Fase Concluída!",
                message: `Parabéns! Você completou a fase "${phase.name}".`,
                type: "phase_completion" as const
            };
            
            showReward(rewardData);
            
            queryClient.invalidateQueries({ queryKey: ["phaseStatus", user.id, phase.id] });
            queryClient.invalidateQueries({ queryKey: ["moduleProgress", user.id, phase.module_id] });
            
            toast.success("Fase concluída com sucesso!");
            navigate(`/modulo/${phase.module_id}`);
        } catch (error) {
            console.error("Erro ao completar fase:", error);
            toast.error("Erro ao completar a fase. Tente novamente.");
        }
    };

    if (isPhaseLoading || isUserLoading || isStatusLoading) {
        return <div className="p-4 text-center">Carregando...</div>;
    }

    if (phaseError || userError || statusError) {
        return (
            <div className="p-4 text-center">
                Erro ao carregar a fase.
            </div>
        );
    }

    if (!phase) {
        return <div className="p-4 text-center">Fase não encontrada.</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="p-4 sm:p-6">
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
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-card-foreground">
                                Conteúdo da Fase
                            </h3>
                            {textContent && (
                                <Button
                                    onClick={handleTextToSpeech}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    {isSpeaking ? (
                                        <Pause className="h-4 w-4" />
                                    ) : (
                                        <Play className="h-4 w-4" />
                                    )}
                                    {isSpeaking ? "Pausar" : "Ouvir"}
                                </Button>
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

                <div className="flex justify-between items-center">
                    <Button
                        onClick={() => navigate(`/modulo/${phase.module_id}`)}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar ao Módulo
                    </Button>
                    
                    {status !== "completed" && (
                        <Button
                            onClick={handleCompletePhase}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        >
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Concluir Fase
                        </Button>
                    )}
                </div>
            </main>
            
            <BottomNavigation />
        </div>
    );
}
