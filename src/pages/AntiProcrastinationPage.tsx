// ========================================================================================
// ARQUIVO: src/pages/AntiProcrastinationPage.tsx (VERSÃO FINAL REVISADA)
// DESCRIÇÃO: Componente com botão de voltar, scroll resetado a cada etapa,
//            e refinamentos de UI/UX para uma experiência de usuário superior.
// ========================================================================================


// --- 1. IMPORTAÇÕES DE BIBLIOTECAS E RECURSOS ---
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Play, Pause, Check, Target, Clock, Zap, Brain, Lightbulb,
    CheckCircle2, Rocket, Star, BookOpen, PenTool, BarChart3, Trophy
} from 'lucide-react';
import { cn } from "@/lib/utils";
import BottomNavigation from "@/components/BottomNavigation";
import { generateMicroActions, MicroAction } from "@/services/procastion"; // Corrigido de 'procastion' para o nome correto


// --- 2. HOOK AUXILIAR E DEFINIÇÕES DE TIPO ---
const useStoredState = (key, defaultValue) => {
    const [value, setValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error("Erro ao ler do localStorage", error);
            return defaultValue;
        }
    });
    useEffect(() => {
        window.localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    return [value, setValue];
};

// AJUSTE: Usar strings em inglês para robustez, mas exibir em português na UI.
type Step = "input" | "breakdown" | "session" | "complete";
type Difficulty = "easy" | "medium" | "hard";


// --- 3. COMPONENTES AUXILIARES DA PÁGINA ---
// MELHORIA: Header principal agora tem um botão de voltar, inspirado no JournalHeader.
const PlannerHeader = ({ onBackClick }) => (
    <motion.div
        variants={{ hidden: { y: -20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
        className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="relative z-10 flex items-center justify-between">
            <motion.button onClick={onBackClick} className="w-10 h-10 -ml-2 p-2 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <div className="text-center">
                <h1 className="text-2xl font-extrabold text-white">Foco na Missão</h1>
                <p className="text-white/70 text-sm">Quebre tarefas em vitórias.</p>
            </div>
            <div className="w-10 h-10"></div> {/* Espaçador para manter o título centralizado */}
        </div>
    </motion.div>
);

const StepHeader = ({ title, subtitle, onBack }) => (
    <div className="flex items-center justify-between p-4 border-b border-border">
        <motion.button
            className="w-10 h-10 bg-card hover:bg-muted rounded-full flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <div className="text-center">
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="w-10 h-10" />
    </div>
);

const CelebrationModal = ({ onComplete }) => (
    <motion.div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onComplete}>
        <motion.div
            className="bg-card rounded-3xl p-8 text-center max-w-sm w-full border border-border"
            initial={{ scale: 0.8, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
            transition={{ scale: { type: "spring", stiffness: 300, damping: 15 }, rotate: { duration: 0.3 } }}>
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-500/20">
                <Star className="w-10 h-10 text-white fill-current" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Micro-vitória!</h3>
            <p className="text-muted-foreground">Mais um passo dado contra a procrastinação. Continue assim! 🚀</p>
        </motion.div>
    </motion.div>
);


// --- 4. COMPONENTE PRINCIPAL: AntiProcrastinationPage ---
export default function AntiProcrastinationPage() {
    const navigate = useNavigate();

    // --- ESTADOS ---
    const [currentStep, setCurrentStep] = useState<Step>("input");
    const [mainTask, setMainTask] = useState("");
    const [taskDifficulty, setTaskDifficulty] = useState<Difficulty>("medium");
    const [microActions, setMicroActions] = useState<MicroAction[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentActionIndex, setCurrentActionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isWorking, setIsWorking] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [completedActions, setCompletedActions] = useStoredState("completed-actions-v2", []);
    const [totalSessions, setTotalSessions] = useStoredState("total-focus-sessions-v2", 0);

    // --- FUNÇÕES DE CONTROLE ---
    const handleStartBreakdown = async () => {
        if (!mainTask.trim() || isGenerating) return;
        setIsGenerating(true);
        const actions = await generateMicroActions(mainTask, taskDifficulty);
        setIsGenerating(false);
        setMicroActions(actions);
        setCurrentActionIndex(0);
        setCurrentStep("breakdown");
    };

    const handleStartSession = () => {
        if (microActions.length === 0) return;
        const firstActionDuration = microActions[0].duration;
        setTimeLeft(firstActionDuration * 60);
        setIsWorking(true);
        setCurrentStep("session");
    };

    const handleCompleteAction = () => {
        setIsWorking(false);
        setShowCelebration(true);
        setTimeout(() => {
            setShowCelebration(false);
            if (currentActionIndex < microActions.length - 1) {
                const nextIndex = currentActionIndex + 1;
                setCurrentActionIndex(nextIndex);
                const nextActionDuration = microActions[nextIndex].duration;
                setTimeLeft(nextActionDuration * 60);
            } else {
                setTotalSessions(totalSessions + 1);
                setCurrentStep("complete");
            }
        }, 2500);
    };

    const resetPlanner = () => {
        setCurrentStep("input");
        setMainTask("");
        setMicroActions([]);
    };

    // --- EFEITOS COLATERAIS (useEffect) ---
    useEffect(() => {
        if (!isWorking || timeLeft <= 0 || currentStep !== "session") return;
        const interval = setInterval(() => { setTimeLeft((time) => time - 1); }, 1000);
        return () => clearInterval(interval);
    }, [isWorking, timeLeft, currentStep]);

    useEffect(() => {
        if (timeLeft === 0 && currentStep === "session") { handleCompleteAction(); }
    }, [timeLeft, currentStep]);

    // MELHORIA: Efeito para resetar o scroll para o topo sempre que a etapa mudar.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentStep]);

    // --- RENDERIZAÇÃO ---
    const renderStep = () => {
        switch (currentStep) {
            case "input":
                return (
                    <div className="space-y-6 p-4 sm:p-6">
                        <PlannerHeader onBackClick={() => navigate(-1)} />
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <label className="block text-lg font-bold text-foreground mb-3">Qual missão você está adiando?</label>
                            <textarea value={mainTask} onChange={(e) => setMainTask(e.target.value)}
                                placeholder="Ex: Estudar pra prova de história, Fazer o TCC..."
                                className="w-full h-28 p-4 bg-card border-2 border-border rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                            />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <h3 className="text-lg font-bold text-foreground mb-3">Qual o nível de desafio?</h3>
                            <div className="space-y-3">
                                {[
                                    { id: "easy", label: "Tranquilo", emoji: "😌", desc: "Só falta um empurrãozinho." },
                                    { id: "medium", label: "Desafiador", emoji: "🤔", desc: "Preciso de um bom plano." },
                                    { id: "hard", label: "Intimidador", emoji: "😰", desc: "Parece uma montanha pra escalar." },
                                ].map((d) => (
                                    <motion.button key={d.id} onClick={() => setTaskDifficulty(d.id as Difficulty)}
                                        className={cn("w-full p-4 rounded-2xl border-2 text-left transition-all duration-300", taskDifficulty === d.id ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : "border-border bg-card hover:border-primary/50")}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }}>
                                        <div className="flex items-center gap-4">
                                            <span className="text-3xl">{d.emoji}</span>
                                            <div>
                                                <div className="font-bold text-foreground">{d.label}</div>
                                                <div className="text-sm text-muted-foreground">{d.desc}</div>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                        <div className="pt-4">
                            <motion.button className={cn("w-full btn-saga-primario py-4 text-base font-bold flex items-center justify-center gap-2", (!mainTask.trim() || isGenerating) && "bg-muted text-muted-foreground cursor-not-allowed")}
                                onClick={handleStartBreakdown} disabled={!mainTask.trim() || isGenerating}
                                whileHover={mainTask.trim() && !isGenerating ? { scale: 1.02 } : {}} whileTap={mainTask.trim() && !isGenerating ? { scale: 0.98 } : {}}>
                                {isGenerating ? (
                                    <><Rocket className="w-5 h-5 animate-pulse" /><span>Criando seu plano...</span></>
                                ) : mainTask.trim() ? (
                                    <><span>Criar Plano de Ação</span><ArrowRight className="w-5 h-5" /></>
                                ) : ("Primeiro, digite sua missão")}
                            </motion.button>
                        </div>
                    </div>
                );
            case "breakdown":
                const totalEstimatedTime = microActions.reduce((sum, action) => sum + action.duration, 0);
                const totalXpReward = microActions.reduce((sum, action) => sum + action.xp, 0);
                const typeIcons = { review: BookOpen, practice: PenTool, organize: BarChart3, create: Zap, exam: Trophy };
                const difficultyConfig = {
                    easy: { label: 'Fácil', classes: 'bg-green-500/10 text-green-400 border-green-500/20' },
                    medium: { label: 'Médio', classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
                    hard: { label: 'Difícil', classes: 'bg-red-500/10 text-red-400 border-red-500/20' },
                };

                return (
                    <>
                        <motion.div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 text-white relative overflow-hidden"
                            initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                            <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/10 rounded-full opacity-50"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <motion.button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm" onClick={() => setCurrentStep("input")}>
                                        <ArrowLeft className="w-5 h-5" />
                                    </motion.button>
                                    <h1 className="text-xl font-bold">Plano de Ação</h1>
                                    <div className="w-10"></div>
                                </div>
                                <div className="mb-4">
                                    <p className="text-sm text-white/60">Missão Principal</p>
                                    <h2 className="text-2xl font-bold">{mainTask}</h2>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-center bg-white/10 p-2 rounded-2xl">
                                    <div><p className="font-bold text-lg">{microActions.length}</p><p className="text-xs text-white/70">Passos</p></div>
                                    <div><p className="font-bold text-lg">~{totalEstimatedTime} min</p><p className="text-xs text-white/70">Estimado</p></div>
                                    <div><p className="font-bold text-lg text-primary">+{totalXpReward} XP</p><p className="text-xs text-white/70">Recompensa</p></div>
                                </div>
                            </div>
                        </motion.div>
                        <div className="p-4 sm:p-6 space-y-4">
                            <h3 className="text-lg font-bold text-foreground">Suas Micro-Ações</h3>
                            {microActions.map((action, index) => {
                                const Icon = typeIcons[action.type] || Target;
                                const diffInfo = difficultyConfig[action.difficulty] || difficultyConfig.medium;
                                return (
                                    <motion.div key={index}
                                        className={cn("bg-card rounded-2xl border border-border overflow-hidden transition-all", index === 0 && "border-primary shadow-lg shadow-primary/10")}
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
                                        <div className="p-5">
                                            <div className="flex items-start gap-4">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                                        <Icon className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">{index + 1}</div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-foreground leading-tight">{action.description}</h4>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2 mb-4">
                                                        <span className={cn('px-2 py-0.5 rounded-full border font-medium', diffInfo.classes)}>
                                                            {diffInfo.label}
                                                        </span>
                                                        <div className="flex items-center gap-1"><Clock size={12} /> {action.duration} min</div>
                                                        <div className="flex items-center gap-1 text-primary font-medium"><Star size={12} /> +{action.xp} XP</div>
                                                    </div>
                                                    <div className="bg-muted/50 rounded-lg p-3 border border-border">
                                                        <div className="flex items-center gap-2 mb-2"><Lightbulb className="w-4 h-4 text-yellow-400" /><span className="text-xs font-bold text-foreground">#pegaessadica</span></div>
                                                        <ul className="space-y-1 list-disc list-inside">
                                                            {action.tips.map((tip, tipIndex) => <li key={tipIndex} className="text-xs text-muted-foreground">{tip}</li>)}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        <div className="px-4 sm:px-6 pt-4 pb-8 sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent">
                            <motion.button className="w-full btn-saga-primario py-4 text-base font-bold flex items-center justify-center gap-2"
                                onClick={handleStartSession}>
                                <Play className="w-5 h-5" /> Começar o plano
                            </motion.button>
                        </div>
                    </>
                );
            case "session":
                const progress = ((currentActionIndex + 1) / microActions.length) * 100;
                const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
                return (
                    <div className="flex flex-col flex-1">
                        <StepHeader title="Sessão de Foco" subtitle={`Ação ${currentActionIndex + 1} de ${microActions.length}`} onBack={() => setCurrentStep("breakdown")} />
                        <div className="p-4 sm:p-6 flex flex-col justify-between flex-1">
                            <div className="mb-8"><div className="flex justify-between items-center mb-2"><span className="text-sm font-medium text-muted-foreground">Progresso da Missão</span><span className="text-sm font-bold text-primary">{Math.round(progress)}%</span></div><div className="w-full bg-muted rounded-full h-2.5"><motion.div className="bg-primary h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: "easeOut" }} /></div></div>
                            <div className="flex flex-col items-center justify-center flex-grow text-center">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border-2 border-primary rounded-3xl p-6 w-full max-w-sm"><div className="flex items-center justify-center gap-2 mb-4"><Target className="w-5 h-5 text-primary" /><p className="text-primary font-bold">FOCO ATUAL</p></div><p className="text-2xl font-bold text-foreground leading-tight">{microActions[currentActionIndex]?.description}</p></motion.div>
                                <motion.div key={timeLeft} className="text-7xl font-light text-foreground tabular-nums my-8" initial={{ scale: 1.05, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>{formatTime(timeLeft)}</motion.div>
                            </div>
                            <div className="flex items-center justify-center gap-10">
                                <motion.button className="text-muted-foreground hover:text-foreground" onClick={() => setIsWorking(false)} whileTap={{ scale: 0.9 }}><Pause size={32} /></motion.button>
                                <motion.button onClick={() => setIsWorking(!isWorking)} whileTap={{ scale: 0.95 }} className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">{isWorking ? <Pause size={36} /> : <Play size={36} className="ml-1" />}</motion.button>
                                <motion.button className="text-green-500 hover:text-green-400" onClick={handleCompleteAction} whileTap={{ scale: 0.9 }}><CheckCircle2 size={32} /></motion.button>
                            </div>
                        </div>
                    </div>
                );
            case "complete":
                return (
                    <div className="p-4 flex flex-col items-center justify-center text-center flex-1">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: "spring", duration: 1 }}><CheckCircle2 className="w-24 h-24 text-green-500 mb-6" /></motion.div>
                        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-3xl font-extrabold text-foreground mb-3">Missão Cumprida! 🎉</motion.h1>
                        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-muted-foreground mb-8 max-w-xs">Você detonou a procrastinação. Orgulhe-se da sua jornada!</motion.p>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-card border border-border rounded-2xl p-4 w-full text-left mb-8"><p className="text-sm text-muted-foreground mb-1">Resumo da Missão</p><p className="font-bold text-foreground">{mainTask}</p></motion.div>
                        <div className="w-full space-y-3">
                            <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="w-full btn-saga-primario py-4 font-bold" onClick={resetPlanner}>Nova Missão</motion.button>
                            <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }} className="w-full py-4 font-bold bg-card border border-border rounded-xl text-foreground" onClick={() => navigate(-1)}>Voltar</motion.button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // --- 8. ESTRUTURA FINAL E RENDERIZAÇÃO ---
    return (
        <div className="relative min-h-screen pb-10 bg-background font-nunito">
            <div className="max-w-md mx-auto flex flex-col min-h-screen">
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} className="flex flex-col flex-1"
                        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {showCelebration && (<CelebrationModal onComplete={() => setShowCelebration(false)} />)}
            </AnimatePresence>
            <BottomNavigation />
        </div>
    );
}