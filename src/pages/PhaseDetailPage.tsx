// ARQUIVO: src/pages/PhaseDetailPage.tsx (VERSÃO FINAL COM NOVO HEADER DE CONTEÚDO)

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Check, ArrowLeft, Play, Pause, FastForward, RotateCcw, Award, PenTool,
  Quote as QuoteIcon, CheckCircle, Trophy, Heart, BookOpen, Video, Home,
  Bookmark, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import YoutubeEmbed from "@/components/YoutubeEmbed";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { motion, AnimatePresence, useScroll, useInView } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import {
  getPhaseById, getModuleById, getPhasesByModuleId, getQuestionsByPhaseId,
  completePhaseAndAwardXp, updateUserPhaseStatus, getUserPhaseStatus,
  Phase, Module, Question
} from "@/services/moduleService";
import { createJournalEntry } from "@/services/journalService";
import { useRewardModal } from "@/components/XpRewardModal/RewardModalContext";
import { usePhaseAudio } from "@/hooks/usePhaseAudio";
import { PhaseDetailSkeleton } from "@/components/phase-detail/PhaseDetailSkeleton";
import { QuizContent } from "@/components/phase-detail/QuizContent";
import Header from "@/components/Header";

const MotionCard = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: delay * 0.15 }}
  >
    {children}
  </motion.div>
);

const PhaseContent = ({
  phase, module, allPhases, questions, userId
}: {
  phase: Phase; module: Module; allPhases: Phase[]; questions: Question[]; userId: string | null;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showRewardModal } = useRewardModal();

  const mainContentRef = useRef(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const actionButtonsRef = useRef(null);
  const { scrollYProgress } = useScroll({ container: mainContentRef });
  const areButtonsInView = useInView(actionButtonsRef, { root: mainContentRef, once: false, amount: 0.5 });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [journalNotes, setJournalNotes] = useState("");
  const [isJournalSaved, setIsJournalSaved] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [likedQuotes, setLikedQuotes] = useState<number[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imagesInContent, setImagesInContent] = useState<{ src: string }[]>([]);
  const [activeStudents] = useState(Math.floor(Math.random() * (75 - 20 + 1)) + 20); // Número aleatório entre 20 e 75

  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [quizElapsedTime, setQuizElapsedTime] = useState<number | null>(null);

  const { isPlaying, isLoadingAudio, speechRate, handleReadContent, handleSpeedChange, handleResetAudio } = usePhaseAudio();

  const journalMutation = useMutation({
    mutationFn: createJournalEntry,
    onSuccess: () => {
      setIsJournalSaved(true);
      setTimeout(() => setIsJournalSaved(false), 2500);
    },
    onError: (err) => console.error("Erro ao gravar crônicas:", err),
  });

  useEffect(() => {
      if (phase?.type === 'quiz' && questions.length > 0 && !quizCompleted && !quizStartTime) {
          setQuizStartTime(Date.now());
      }
  }, [phase?.type, questions.length, quizCompleted, quizStartTime]);

  useEffect(() => {
    setJournalNotes("");
    setIsJournalSaved(false);
    setCurrentQuestionIndex(0);
    setQuizCompleted(false);
    handleResetAudio();
    setQuizStartTime(null);
    setQuizElapsedTime(null);
    if(mainContentRef.current) (mainContentRef.current as HTMLDivElement).scrollTo(0, 0);
  }, [phase.id, handleResetAudio]);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;
    const imageElements = contentElement.querySelectorAll("img");
    const sources = Array.from(imageElements).map((img) => ({ src: img.src }));
    setImagesInContent(sources);
    const handleImageClick = (index: number) => {
      setLightboxIndex(index);
      setLightboxOpen(true);
    };
    imageElements.forEach((img, index) => {
      img.style.cursor = "pointer";
      const clickHandler = () => handleImageClick(index);
      img.addEventListener("click", clickHandler);
      (img as any).clickHandler = clickHandler;
    });
    return () => {
      imageElements.forEach((img) => {
        if ((img as any).clickHandler) img.removeEventListener("click", (img as any).clickHandler);
      });
    };
  }, [phase.content]);

  const currentPhaseIndex = allPhases.findIndex((p) => p.id === phase.id);
  const previousPhase = currentPhaseIndex > 0 ? allPhases[currentPhaseIndex - 1] : null;
  const nextPhase = currentPhaseIndex >= 0 && currentPhaseIndex < allPhases.length - 1 ? allPhases[currentPhaseIndex + 1] : null;
  const canComplete = phase?.type !== "quiz" || quizCompleted;

  const navigateToNext = () => {
    if (nextPhase) {
      navigate(`/modulo/${module.id}/fase/${nextPhase.id}`);
    } else {
      navigate(`/modulo/${module.id}`);
    }
    queryClient.invalidateQueries({ queryKey: ["moduleDetailData", module.id] });
  };

  const handleSaveJournal = async () => {
    if (!journalNotes.trim() || !userId) return;
    await journalMutation.mutateAsync({
      user_id: userId, title: `Crônicas sobre: ${phase.name}`, content: journalNotes,
      emoji: "💡", module_id: module.id, phase_id: phase.id, is_favorite: false,
    });
  };

  const handleLikeQuote = (quoteId: number) => {
    setLikedQuotes(prev => prev.includes(quoteId) ? prev.filter(id => id !== quoteId) : [...prev, quoteId]);
  };

  const handleCompletePhase = async () => {
    if (isSubmitting || !userId) return;
    setIsSubmitting(true);
    try {
      if (journalNotes.trim() && !isJournalSaved) await handleSaveJournal();

      const { data: profileBefore } = await supabase.from("profiles").select("xp").eq("id", userId).single();
      const userXpBefore = profileBefore?.xp || 0;

      const result = await completePhaseAndAwardXp(userId, phase.id, module.id, phase?.type === 'quiz');

      const { data: profileAfter } = await supabase.from("profiles").select("xp").eq("id", userId).single();
      const userXpAfter = profileAfter?.xp || 0;
      const totalXp = userXpAfter - userXpBefore;

      if (totalXp > 0) {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, zIndex: 9999 });
        const modalTitle = result.xpFromModule > 0 ? "Reino Conquistado!" : "Missão Concluída!";
        await showRewardModal({ xpAmount: totalXp, title: modalTitle });
      }
      queryClient.invalidateQueries({ queryKey: ["modulesPageInitialData", "moduleDetailData", "userProfile"] });
      navigateToNext();
    } catch (err) {
      console.error("Erro crítico ao completar fase:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCorrectAnswer = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
      setQuizElapsedTime(Date.now() - (quizStartTime || Date.now()));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background font-nunito">
        <Header 
            showBackButton={true}
            onBackClick={() => navigate(`/modulo/${module.id}`)}
            rightContent={ 
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20"><Bookmark /></Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20"><Home /></Button>
              </div>
            }
        />
        <motion.div
            className="h-1.5 bg-gradient-to-r from-yellow-300 via-primary to-orange-500"
            style={{ scaleX: scrollYProgress, transformOrigin: "0%" }}
        />
        <main ref={mainContentRef} className="flex-1 overflow-y-auto">
          <AnimatePresence>
            <div className="container px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto space-y-8">

                {/* NOVO HEADER DE CONTEÚDO */}
                <div className="text-center card-trilha p-6 -mt-2">
                    <p className="text-sm font-semibold text-primary mb-2">
                      Missão {currentPhaseIndex + 1} de {allPhases.length}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {phase.name}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      no Reino de {module.name}
                    </p>
                    <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold px-3 py-1.5 rounded-full mt-4 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      {activeStudents} pessoas nesta jornada
                    </div>
                </div>

                <MotionCard delay={0}>
                  {(phase.type === "text" || phase.type === "challenge") && (
                    <div className="card-trilha p-4 sm:p-6">
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
                          <Button onClick={() => handleReadContent(phase.content)} disabled={isLoadingAudio} variant="outline" className="font-semibold">
                            {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                            {isPlaying ? "Pausar" : "Ouvir Narração"}
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleSpeedChange(phase.content)} className="text-muted-foreground"><FastForward className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={handleResetAudio} className="text-muted-foreground"><RotateCcw className="h-4 w-4" /></Button>
                            <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded">{speechRate.toFixed(2)}x</span>
                          </div>
                      </div>

                      <h2 className="cabecalho-secao mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5" />Narrativa da Missão</h2>
                      <div ref={contentRef} className="prose max-w-none prose-slate dark:prose-invert" dangerouslySetInnerHTML={{ __html: phase.content || "" }} />
                    </div>
                  )}
                  {phase.type === 'quiz' && (
                    <div className="card-trilha p-4 sm:p-6">
                      <QuizContent 
                        questions={questions} 
                        currentQuestionIndex={currentQuestionIndex} 
                        onCorrectAnswer={handleCorrectAnswer} 
                        quizCompleted={quizCompleted} 
                        currentQuestion={questions[currentQuestionIndex]}
                        quizStartTime={quizStartTime}
                        quizElapsedTime={quizElapsedTime}
                      />
                    </div>
                  )}
                </MotionCard>

                {phase.video_url && (
                    <MotionCard delay={1}>
                        <div className="card-gradient-orange rounded-2xl overflow-hidden">
                            <h2 className="cabecalho-secao p-4 pb-2 sm:p-6 sm:pb-4 flex items-center gap-2"><Video className="w-5 h-5" />Recurso em Vídeo</h2>
                            <YoutubeEmbed videoId={phase.video_url} />
                        </div>
                    </MotionCard>
                )}

                {phase.quote && (
                  <MotionCard delay={2}>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <h3 className="text-lg font-bold text-foreground mb-3 flex items-center"><QuoteIcon className="w-5 h-5 mr-2 text-primary" />Palavras do Sábio</h3>
                          <blockquote className="text-muted-foreground italic border-l-4 border-primary pl-4 py-1">"{phase.quote}"</blockquote>
                          {phase.quote_author && (<cite className="mt-3 block text-right text-sm font-semibold not-italic text-muted-foreground">— {phase.quote_author}</cite>)}
                        </div>
                        <motion.button onClick={() => handleLikeQuote(phase.id)} className={cn("p-2 rounded-full transition-colors", likedQuotes.includes(phase.id) ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-red-900/50 dark:hover:text-red-400')} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Heart className="w-5 h-5" fill={likedQuotes.includes(phase.id) ? 'currentColor' : 'none'}/>
                        </motion.button>
                      </div>
                    </div>
                  </MotionCard>
                )}

                <MotionCard delay={3}>
                  <div className="bg-card rounded-2xl p-6 border border-border/10 shadow-sm">
                    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-foreground flex items-center"><PenTool className="w-5 h-5 mr-2 text-primary" />Crônicas da Jornada</h3><div className="text-sm text-primary bg-primary/10 px-3 py-1 rounded-full font-semibold">Suas Descobertas</div></div>
                    <p className="text-muted-foreground text-sm mb-4">Registre aqui seus insights e reflexões. Este é o seu mapa do tesouro pessoal, documentando sua evolução.</p>
                    <Textarea value={journalNotes} onChange={(e) => setJournalNotes(e.target.value)} placeholder="O que mais chamou sua atenção? Como isso se aplica a você? Qual seu próximo passo prático?..." className="w-full min-h-[120px] p-4 bg-input rounded-xl border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none" rows={5}/>
                    <div className="flex justify-end mt-4">
                      <Button onClick={handleSaveJournal} disabled={journalMutation.isPending || !journalNotes.trim()} className={cn("transition-all", isJournalSaved ? 'bg-green-500 hover:bg-green-600' : 'btn-saga-primario')}>
                        {journalMutation.isPending ? "Gravando..." : isJournalSaved ? (<><Check className="mr-2 h-4 w-4"/>Gravado!</>) : (<><CheckCircle className="mr-2 h-4 w-4"/>Gravar na Crônica</>)}
                      </Button>
                    </div>
                  </div>
                </MotionCard>

                <div ref={actionButtonsRef} className="pt-8">
                   <motion.div 
                      key={phase.id} 
                      className="flex items-center justify-center gap-4" 
                      initial={{ opacity: 0, y: 50 }} 
                      animate={areButtonsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }} 
                      transition={{ duration: 0.7, ease: "easeOut" }}
                   >
                      {previousPhase && (
                         <Button variant="outline" onClick={() => navigate(`/modulo/${module.id}/fase/${previousPhase.id}`)} className="h-14 px-6 flex items-center shadow-sm">
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Missão Anterior
                         </Button>
                      )}
                      {canComplete && (
                         <Button onClick={handleCompletePhase} disabled={isSubmitting} className="btn-saga-primario h-14 text-lg px-8 shadow-lg">
                            {isSubmitting ? <Trophy className="w-6 h-6 animate-pulse" /> : <Award className="w-6 h-6" />}
                            <span className="ml-2">{isSubmitting ? 'Concluindo...' : 'Concluir Missão'}</span>
                         </Button>
                      )}
                    </motion.div>
                </div>
            </div>
          </AnimatePresence>
        </main>
        <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={imagesInContent} index={lightboxIndex} />
    </div>
  );
};

export default function PhaseDetailPage() {
  const { moduleId, id: phaseId } = useParams<{ moduleId: string; id: string; }>();
  const [userId, setUserId] = useState<string | null>(null);

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
        }
    };
    getUserIdAndStatus();
  }, [phaseId]);

  const { data, isLoading, error } = useQuery({
      queryKey: ["phaseDetailData", phaseId, userId],
      queryFn: async () => {
          if (!phaseId || !moduleId || !userId) throw new Error("IDs não encontrados.");
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

  if (isLoading) return <PhaseDetailSkeleton />;

  if (error || !data) return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4 text-center">
          <p>Não foi possível carregar a missão... Tente voltar e entrar novamente.</p>
      </div>
  );

  return <PhaseContent {...data} userId={userId} />;
}