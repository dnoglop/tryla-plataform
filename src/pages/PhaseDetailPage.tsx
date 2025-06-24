// ARQUIVO: src/pages/PhaseDetailPage.tsx (VERSÃO FINAL COMPLETA E FUNCIONAL)

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Home, ArrowLeft, Play, Pause, FastForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import YoutubeEmbed from "@/components/YoutubeEmbed";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

// Serviços, Hooks e Componentes
import { getPhaseById, getModuleById, getPhasesByModuleId, getQuestionsByPhaseId, completePhaseAndAwardXp, updateUserPhaseStatus, getUserPhaseStatus, Phase, Module, Question } from "@/services/moduleService";
import { createJournalEntry } from "@/services/journalService";
import { useRewardModal } from "@/components/XpRewardModal/RewardModalContext";
import { usePhaseAudio } from "@/hooks/usePhaseAudio";
import Header from "@/components/Header";
import { PhaseDetailSkeleton } from "@/components/phase-detail/PhaseDetailSkeleton";
import { QuizContent } from "@/components/phase-detail/QuizContent";
import { ActionButton } from "@/components/journey/ActionButton";
import BottomNavigation from "@/components/BottomNavigation";

export default function PhaseDetailPage() {
    // 1. Hooks
    const { moduleId, id: phaseId } = useParams<{ moduleId: string; id: string; }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showRewardModal } = useRewardModal();
    const mainContentRef = useRef(null);
    const { scrollYProgress } = useScroll({ container: mainContentRef });
    const contentRef = useRef<HTMLDivElement>(null);

    // 2. States
    const [userId, setUserId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [journalNotes, setJournalNotes] = useState("");
    const [isJournalSaved, setIsJournalSaved] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [imagesInContent, setImagesInContent] = useState<{ src: string }[]>([]);

    // 3. Hooks Customizados
    const { isPlaying, isLoadingAudio, speechRate, handleReadContent: baseHandleReadContent, handleSpeedChange: baseHandleSpeedChange, handleResetAudio, stopAudio } = usePhaseAudio();

    // 4. Data Fetching
    const { data, isLoading, error } = useQuery({
        queryKey: ["phaseDetailData", phaseId, userId],
        queryFn: async () => {
            if (!phaseId || !moduleId || !userId) throw new Error("IDs não encontrados para a busca.");
            const [phase, module, allPhases, questions] = await Promise.all([
                getPhaseById(Number(phaseId)),
                getModuleById(Number(moduleId)),
                getPhasesByModuleId(Number(moduleId)),
                getQuestionsByPhaseId(Number(phaseId)),
            ]);
            if (!phase || !module) throw new Error("Missão ou Reino não encontrado.");
            return { phase, module, allPhases, questions };
        },
        enabled: !!phaseId && !!moduleId && !!userId,
    });

    const { phase, module, allPhases = [], questions = [] } = data || {};
    const currentQuestion = questions[currentQuestionIndex];

    const journalMutation = useMutation({
        mutationFn: createJournalEntry,
        onSuccess: () => { setIsJournalSaved(true); toast.success("Suas crônicas foram gravadas!"); },
        onError: () => toast.error("Erro ao gravar suas crônicas."),
    });

    // 5. Lógica Derivada e Efeitos Colaterais
    const currentPhaseIndex = allPhases.findIndex((p) => p.id === Number(phaseId));
    const previousPhase = currentPhaseIndex > 0 ? allPhases[currentPhaseIndex - 1] : null;
    const nextPhase = currentPhaseIndex >= 0 && currentPhaseIndex < allPhases.length - 1 ? allPhases[currentPhaseIndex + 1] : null;

    useEffect(() => {
        setJournalNotes("");
        setIsJournalSaved(false);
        setCurrentQuestionIndex(0);
        setQuizCompleted(false);
        handleResetAudio();
    }, [phaseId, handleResetAudio]);

    useEffect(() => {
        const getUserIdAndStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                if (phaseId) {
                    const currentStatus = await getUserPhaseStatus(user.id, Number(phaseId));
                    if (currentStatus === "notStarted") {
                        updateUserPhaseStatus(user.id, Number(phaseId), "inProgress");
                    }
                }
            } else { navigate("/login"); }
        };
        getUserIdAndStatus();
        return () => stopAudio();
    }, [phaseId, stopAudio, navigate]);

    // 6. Handlers
    const navigateToNext = () => {
        if (nextPhase) {
            navigate(`/modulo/${moduleId}/fase/${nextPhase.id}`);
        } else {
            toast.success(`Você concluiu todas as missões do Reino de "${module?.name}"!`);
            navigate(`/modulo/${moduleId}`);
        }
        queryClient.invalidateQueries({ queryKey: ["moduleDetailData", Number(moduleId)] });
    };

    const handleSaveJournal = async () => {
        const notesToSave = journalNotes.trim();
        if (!notesToSave || !userId || !phase || !module) {
            toast.info("Escreva algo para gravar em suas crônicas.");
            return;
        }
        await journalMutation.mutateAsync({
            user_id: userId,
            title: `Crônicas sobre: ${phase.name}`,
            content: notesToSave,
            emoji: "💡",
            module_id: module.id,
            phase_id: phase.id,
            is_favorite: false,
        });
    };

    const handleCompletePhase = (): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            if (isSubmitting || !userId || !phaseId || !moduleId) {
              reject(new Error("Submissão já em progresso ou dados faltando."));
              return;
            }
            setIsSubmitting(true);
            try {
                if (journalNotes.trim() && !isJournalSaved) await handleSaveJournal();
                const { data: profileBefore } = await supabase.from("profiles").select("xp").eq("id", userId).single();
                const userXpBefore = profileBefore?.xp || 0;
                const result = await completePhaseAndAwardXp(userId, Number(phaseId), Number(moduleId), phase?.type === 'quiz');
                let totalXp = (result.xpFromPhase || 0) + (result.xpFromModule || 0);
                if (totalXp === 0) {
                    const { data: profileAfter } = await supabase.from("profiles").select("xp").eq("id", userId).single();
                    const userXpAfter = profileAfter?.xp || 0;
                    const xpDifference = userXpAfter - userXpBefore;
                    if (xpDifference > 0) totalXp = xpDifference;
                }
                if (totalXp > 0) {
                    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, zIndex: 9999 });
                    const modalTitle = result.xpFromModule > 0 ? "Reino Conquistado!" : "Missão Concluída!";
                    await showRewardModal({ xpAmount: totalXp, title: modalTitle });
                } else { toast.success("Progresso salvo!"); }
                queryClient.invalidateQueries({ queryKey: ["modulesPageInitialData", "moduleDetailData", "userProfile"] });
                navigateToNext();
                resolve();
            } catch (err) {
                console.error("Erro crítico ao completar fase:", err);
                toast.error("Erro ao registrar seu progresso.");
                reject(err);
            } finally {
                setIsSubmitting(false);
            }
        });
    };

    const handleCorrectAnswer = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setQuizCompleted(true);
            toast.success("Teste de habilidade concluído!");
        }
    };

    // 7. Renderização Condicional
    if (isLoading) return <PhaseDetailSkeleton />;
    if (error || !phase || !module) return <div className="flex h-screen w-full items-center justify-center"><p>Não foi possível carregar a missão...</p></div>;

    const canComplete = phase.type !== 'quiz' || quizCompleted;

    // 8. Retorno do JSX
    return (
        <>
            <div className="flex flex-col h-screen bg-background">
                <header className="z-20 shrink-0">
                    <Header 
                        title={phase.name}
                        subtitle={module.name}
                        showBackButton={true}
                        onBackClick={() => navigate(`/modulo/${moduleId}`)}
                        rightContent={ <Link to="/modulos"><Button variant="ghost" size="icon" className="text-white hover:bg-white/20"><Home /></Button></Link> }
                    />
                    <motion.div
                        className="h-1.5 bg-gradient-to-r from-yellow-300 via-primary to-orange-500"
                        style={{ scaleX: scrollYProgress, transformOrigin: "0%" }}
                    />
                </header>

                <main ref={mainContentRef} className="flex-1 overflow-y-auto">
                    <div className="container px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
                      <AnimatePresence mode="wait">
                          <motion.div
                              key={phase.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.5 }}
                          >
                              {/* Bloco de Conteúdo da Fase */}
                              {phase.type === "text" || phase.type === "challenge" ? (
                                  <div className="card-jornada p-4 sm:p-6 space-y-6">
                                      <div className="flex flex-col items-center gap-4">
                                          <Button onClick={() => baseHandleReadContent(phase.content)} disabled={isLoadingAudio} className="btn-saga-primario btn-shine h-10 text-lg px-8">
                                              {isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                                              {isPlaying ? "Pausar a narração" : "Ouvir a narração"}
                                          </Button>
                                          <div className="flex items-center gap-2">
                                              <Button variant="outline" size="icon" onClick={() => baseHandleSpeedChange(phase.content)}><FastForward className="h-4 w-4" /></Button>
                                              <Button variant="outline" size="icon" onClick={handleResetAudio}><RotateCcw className="h-4 w-4" /></Button>
                                              <span className="text-xs font-mono bg-background px-2 py-1 rounded">{speechRate.toFixed(2)}x</span>
                                          </div>
                                      </div>
                                      <div ref={contentRef} className="prose max-w-none prose-slate dark:prose-invert mt-4" dangerouslySetInnerHTML={{ __html: phase.content || "" }} />
                                  </div>
                              ) : phase.type === "video" && phase.video_url ? (
                                  <div className="rounded-2xl overflow-hidden aspect-video shadow-lg"><YoutubeEmbed videoId={phase.video_url} /></div>
                              ) : phase.type === 'quiz' ? (
                                  <QuizContent
                                      questions={questions as Question[]}
                                      currentQuestionIndex={currentQuestionIndex}
                                      onCorrectAnswer={handleCorrectAnswer}
                                      quizCompleted={quizCompleted}
                                      currentQuestion={currentQuestion}
                                  />
                              ) : null}

                              {/* Bloco Unificado e Centralizado de Ações */}
                              <div className="mt-12 flex flex-col items-center gap-6">
                                  <div className="w-full max-w-lg text-center space-y-3">
                                      <h3 className="text-lg font-bold text-foreground">Crônicas da Jornada</h3>
                                      <textarea value={journalNotes} onChange={(e) => setJournalNotes(e.target.value)} placeholder="Registre aqui suas descobertas..." className="w-full p-3 rounded-lg border bg-input focus:ring-2 focus:ring-primary transition text-left" rows={4} />
                                      <Button onClick={handleSaveJournal} disabled={journalMutation.isPending || !journalNotes.trim()} variant="secondary" className="px-6 py-2">
                                          {isJournalSaved ? <CheckCircle className="mr-2 h-4 w-4"/> : null}
                                          {journalMutation.isPending ? "Gravando..." : isJournalSaved ? "Gravada!" : "Gravar na Crônica"}
                                      </Button>
                                  </div>
                                  <div className="flex items-center justify-center gap-4">
                                      {previousPhase && (
                                          <Button variant="outline" onClick={() => navigate(`/modulo/${moduleId}/fase/${previousPhase.id}`)} className="h-14 px-6 flex items-center">
                                              <ArrowLeft className="mr-2 h-5 w-5" />
                                              Voltar
                                          </Button>
                                      )}
                                      {canComplete && (
                                          <ActionButton onClick={handleCompletePhase} initialText="Concluir essa missão" loadingText="Absorvendo..." className="px-8 h-11" />
                                      )}
                                  </div>
                              </div>
                          </motion.div>
                      </AnimatePresence>
                    </div>
                </main>
            </div>
            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={imagesInContent}
                index={lightboxIndex}
            />
        </>
    );
}