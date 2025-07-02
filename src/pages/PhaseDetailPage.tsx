import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useScroll, useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Play, Pause, FastForward, RotateCcw, Award, PenTool,
  Quote as QuoteIcon, Trophy, Heart, Video, Home, Bookmark,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import YoutubeEmbed from "@/components/YoutubeEmbed";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "react-quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";

import {
  getPhaseById,
  getModuleById,
  getPhasesByModuleId,
  getQuestionsByPhaseId,
  getUserPhaseStatus,
  updateUserPhaseStatus,
  completePhase, // <-- Função SIMPLIFICADA
  Phase,
  Module,
  Question,
} from "@/services/moduleService";
import { createJournalEntry } from "@/services/journalService";
import { usePhaseAudio } from "@/hooks/usePhaseAudio";
import { PhaseDetailSkeleton } from "@/components/phase-detail/PhaseDetailSkeleton";
import { QuizContent } from "@/components/phase-detail/QuizContent";
import Header from "@/components/Header";

// Componente de animação para os cards
const MotionCard = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number; }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: delay * 0.15 }}
  >
    {children}
  </motion.div>
);

// Componente principal do conteúdo da fase
const PhaseContent = ({ phase, module, allPhases, questions, userId }: {
  phase: Phase;
  module: Module;
  allPhases: Phase[];
  questions: Question[];
  userId: string | null;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Refs para controle de scroll e visibilidade
  const mainContentRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const actionButtonsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: mainContentRef });
  const areButtonsInView = useInView(actionButtonsRef, { root: mainContentRef, once: false, amount: 0.5 });

  // Estados locais
  const [isCompleting, setIsCompleting] = useState(false);
  const [journalNotes, setJournalNotes] = useState("");
  const [isJournalSaved, setIsJournalSaved] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [likedQuotes, setLikedQuotes] = useState<number[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imagesInContent, setImagesInContent] = useState<{ src: string }[]>([]);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [quizElapsedTime, setQuizElapsedTime] = useState<number | null>(null);
  const [activeStudents] = useState(Math.floor(Math.random() * (75 - 20 + 1)) + 20);

  // Hooks customizados e mutações
  const { isPlaying, isLoadingAudio, speechRate, handleReadContent, handleSpeedChange, handleResetAudio } = usePhaseAudio();
  const journalMutation = useQuery({ mutationFn: createJournalEntry, onSuccess: () => { setIsJournalSaved(true); setTimeout(() => setIsJournalSaved(false), 2500); }, });

  // Efeitos para resetar estados ao mudar de fase
  useEffect(() => {
    if (phase?.type === "quiz" && questions.length > 0 && !quizCompleted && !quizStartTime) {
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
    setIsCompleting(false);
    mainContentRef.current?.scrollTo(0, 0);
  }, [phase.id, handleResetAudio]);

  // Efeito para configurar o lightbox de imagens
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;
    const imageElements = Array.from(contentElement.querySelectorAll("img"));
    setImagesInContent(imageElements.map((img) => ({ src: img.src })));

    const handleImageClick = (index: number) => {
      setLightboxIndex(index);
      setLightboxOpen(true);
    };

    imageElements.forEach((img, index) => {
      img.style.cursor = "pointer";
      img.addEventListener("click", () => handleImageClick(index));
    });

    return () => {
      imageElements.forEach((img, index) => {
        img.removeEventListener("click", () => handleImageClick(index));
      });
    };
  }, [phase.content]);


  // Lógica de navegação entre fases
  const currentPhaseIndex = allPhases.findIndex((p) => p.id === phase.id);
  const previousPhase = currentPhaseIndex > 0 ? allPhases[currentPhaseIndex - 1] : null;
  const nextPhase = currentPhaseIndex < allPhases.length - 1 ? allPhases[currentPhaseIndex + 1] : null;
  const canComplete = phase?.type !== "quiz" || quizCompleted;

  const handleSaveJournal = async () => {
    if (!journalNotes.trim() || !userId) return;
    await journalMutation.refetch({
      user_id: userId,
      title: `Crônicas sobre: ${phase.name}`,
      content: journalNotes,
      emoji: "💡",
      module_id: module.id,
      phase_id: phase.id,
      is_favorite: false,
    });
  };

  const handleLikeQuote = (quoteId: number) => {
    setLikedQuotes((prev) => prev.includes(quoteId) ? prev.filter((id) => id !== quoteId) : [...prev, quoteId]);
  };

  const handleCorrectAnswer = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuizCompleted(true);
      setQuizElapsedTime(Date.now() - (quizStartTime || Date.now()));
    }
  };

  // --- LÓGICA DE CONCLUSÃO DE FASE (SUPER SIMPLIFICADA) ---
  const handleCompletePhase = () => {
    if (isCompleting || !userId) return;

    setIsCompleting(true);

    setTimeout(async () => {
        try {
            if (journalNotes.trim() && !isJournalSaved) {
                await handleSaveJournal();
            }

            // 1. Apenas marca a fase como concluída no banco.
            await completePhase(userId, phase.id);

            queryClient.invalidateQueries({ queryKey: ["moduleDetailData", module.id] });

            // 2. Decide para onde navegar
            if (nextPhase) {
                // Se existe uma próxima fase, vai para ela.
                navigate(`/modulo/${module.id}/fase/${nextPhase.id}`);
            } else {
                // Se NÃO existe próxima fase, o módulo acabou. Vai para a tela de celebração.
                navigate(`/modulo/${module.id}/completo`);
            }
        } catch (err) {
            console.error("Erro crítico ao completar fase:", err);
            setIsCompleting(false);
        }
    }, 1200); // Tempo de loading pode ser menor
  };


  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    <div className="flex flex-col h-screen bg-muted/50 dark:bg-background font-nunito">
      <Header
        title={phase.name}
        subtitle={module.name}
        showBackButton={true}
        onBackClick={() => navigate(`/modulo/${module.id}`)}
        rightContent={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20"><Bookmark /></Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate("/modulos")}><Home /></Button>
          </div>
        }
      />
      <motion.div
        className="h-1.5 bg-gradient-to-r from-yellow-300 via-primary to-orange-500"
        style={{ scaleX: scrollYProgress, transformOrigin: "0%" }}
      />
      <main ref={mainContentRef} className="flex-1 overflow-y-auto">
        <AnimatePresence>
          <div className="container px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto space-y-6">
            <MotionCard>
              <div className="card-trilha p-6 text-center">
                <p className="text-sm font-semibold text-primary mb-2">
                  Missão {currentPhaseIndex + 1} de {allPhases.length}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{phase.name}</h1>
                <p className="text-muted-foreground mt-1">{module.name}</p>
                <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold px-3 py-1.5 rounded-full mt-4 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  {activeStudents} pessoas nesta jornada
                </div>
              </div>
            </MotionCard>
            <MotionCard delay={1}>
              {(phase.type === "text" || phase.type === "challenge") && (
                <div className="card-trilha p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
                    <Button onClick={() => handleReadContent(phase.content)} disabled={isLoadingAudio} variant="outline" className="font-semibold">
                      {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {isPlaying ? "Pausar" : "Ouvir o conteúdo"}
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleSpeedChange(phase.content)} className="text-muted-foreground"><FastForward className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={handleResetAudio} className="text-muted-foreground"><RotateCcw className="h-4 w-4" /></Button>
                      <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded">{speechRate.toFixed(2)}x</span>
                    </div>
                  </div>
                  <div className="ql-snow">
                    <div ref={contentRef} className="ql-editor text-foreground dark:text-gray-300" dangerouslySetInnerHTML={{ __html: phase.content || "" }} />
                  </div>
                </div>
              )}
              {phase.type === "quiz" && (
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
              <MotionCard delay={2}>
                <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4"><div className="bg-white/20 backdrop-blur-sm rounded-full p-2"><Video className="w-6 h-6 text-white" /></div><h2 className="text-xl font-bold text-white">Assista esse vídeo:</h2></div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 overflow-hidden"><YoutubeEmbed videoId={phase.video_url} /></div>
                </div>
              </MotionCard>
            )}
            {phase.quote && (
              <MotionCard delay={3}>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <h3 className="text-lg font-bold text-foreground mb-3 flex items-center"><QuoteIcon className="w-5 h-5 mr-2 text-primary" />Reflita sobre:</h3>
                      <blockquote className="text-muted-foreground italic border-l-4 border-primary pl-4 py-1">"{phase.quote}"</blockquote>
                      {phase.quote_author && <cite className="mt-3 block text-right text-sm font-semibold not-italic text-muted-foreground">— {phase.quote_author}</cite>}
                    </div>
                    <motion.button onClick={() => handleLikeQuote(phase.id)} className={cn("p-2 rounded-full transition-colors", likedQuotes.includes(phase.id) ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-red-900/50 dark:hover:text-red-400")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} >
                      <Heart className="w-5 h-5" fill={likedQuotes.includes(phase.id) ? "currentColor" : "none"} />
                    </motion.button>
                  </div>
                </div>
              </MotionCard>
            )}
            <MotionCard delay={4}>
              <div className="card-trilha p-6">
                <h3 className="text-lg font-bold text-foreground flex items-center mb-2"><PenTool className="w-5 h-5 mr-2 text-primary" />Aprendizado da Jornada</h3>
                <p className="text-muted-foreground text-sm mb-4">Registre os seus insights e reflexões. Este é o seu mapa do tesouro pessoal, documentando sua evolução.</p>
                <Textarea value={journalNotes} onChange={(e) => setJournalNotes(e.target.value)} placeholder="O que mais chamou sua atenção? Como isso se aplica a você? Qual seu próximo passo prático?" className="w-full min-h-[120px] p-4 bg-input rounded-xl border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none" rows={5} />
              </div>
            </MotionCard>
            <div ref={actionButtonsRef} className="pt-4 pb-8">
              <motion.div key={phase.id} className="flex items-center justify-center gap-6" initial={{ opacity: 0, y: 50 }} animate={areButtonsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }} transition={{ duration: 0.7, ease: "easeOut" }} >
                {previousPhase && (<Button variant="outline" onClick={() => navigate(`/modulo/${module.id}/fase/${previousPhase.id}`)} className="h-10 px-4 flex items-center shadow-sm"><ArrowLeft className="mr-2 h-5 w-5" />Voltar</Button>)}
                {canComplete && (
                  <Button onClick={handleCompletePhase} disabled={isCompleting} className="btn-saga-primario h-11 text-lg px-6 shadow-lg min-w-[240px] transition-all duration-300">
                    <AnimatePresence mode="wait">
                      {isCompleting ? (
                        <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                          <Trophy className="w-5 h-5 animate-spin" />
                          <span className="text-base font-semibold">Validando...</span>
                        </motion.span>
                      ) : (
                        <motion.span key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2">
                          <Award className="w-6 h-6" />
                          <span className="font-bold">Concluir lição</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
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


// Componente exportado que faz o fetch dos dados
export default function PhaseDetailPage() {
  const { moduleId, id: phaseId } = useParams<{ moduleId: string; id: string }>();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserIdAndStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        if (phaseId) {
          const currentStatus = await getUserPhaseStatus(user.id, Number(phaseId));
          if (currentStatus === "notStarted") {
            await updateUserPhaseStatus(user.id, Number(phaseId), "inProgress");
          }
        }
      }
    };
    getUserIdAndStatus();
  }, [phaseId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["phaseDetailData", phaseId],
    queryFn: async () => {
      if (!phaseId || !moduleId) throw new Error("IDs não encontrados.");
      const [phase, module, allPhases, questions] = await Promise.all([
        getPhaseById(Number(phaseId)),
        getModuleById(Number(moduleId)),
        getPhasesByModuleId(Number(moduleId)),
        getQuestionsByPhaseId(Number(phaseId)),
      ]);
      if (!phase || !module) throw new Error("Missão ou Reino não encontrado.");
      return { phase, module, allPhases, questions };
    },
    enabled: !!phaseId && !!moduleId,
  });

  if (isLoading) return <PhaseDetailSkeleton />;
  if (error || !data) return <div className="flex h-screen w-full items-center justify-center text-center"><p>Não foi possível carregar a missão... Tente voltar e entrar novamente.</p></div>;

  return <PhaseContent {...data} userId={userId} />;
}