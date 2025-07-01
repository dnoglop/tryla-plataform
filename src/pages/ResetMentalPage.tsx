import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Componentes do seu App
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";

// Ícones
import {
    ArrowLeft, Clock, Sparkles, Play, Pause, CheckCircle2,
    Zap, Cloudy, Smile, Volume2, VolumeX, Loader2, Music, // Ícone de música para o toast
} from "lucide-react";

// --- TIPOS E INTERFACES ---
interface BreathingStrategy {
    id: string;
    name: string;
    description: string;
    pattern: { inspire: number; segure: number; expire: number };
}

// --- CORES BASEADAS NA DURAÇÃO ---
const durationGradients: Record<number, string> = {
    180: "from-cyan-500 to-blue-500",
    300: "from-emerald-500 to-green-500",
    600: "from-amber-500 to-orange-500",
    900: "from-indigo-500 to-purple-500",
};

const breathingStrategies: Record<string, BreathingStrategy> = {
    "ansioso-short": { id: "478", name: "4-7-8 Relaxante", description: "Técnica rápida para acalmar.", pattern: { inspire: 4, segure: 7, expire: 8 }},
    "ansioso-long": { id: "box", name: "Box Breathing", description: "Equilibra o sistema nervoso.", pattern: { inspire: 4, segure: 4, expire: 4 }},
    "cansado-short": { id: "energize", name: "Despertar Rápido", description: "Um shot de energia para a mente.", pattern: { inspire: 6, segure: 2, expire: 4 }},
    "cansado-long": { id: "focus", name: "Foco Sustentado", description: "Para concentração duradoura.", pattern: { inspire: 5, segure: 3, expire: 5 }},
    "neutro-short": { id: "natural", name: "Pausa Consciente", description: "Simples e relaxante.", pattern: { inspire: 4, segure: 2, expire: 6 }},
    "neutro-long": { id: "mindful", name: "Respiração Mindfulness", description: "Para presença e consciência.", pattern: { inspire: 5, segure: 5, expire: 5 }},
};

// --- COMPONENTE PRINCIPAL ---
export default function ResetMentalPage() {
    // Hooks de estado
    const [step, setStep] = useState<"questions" | "session" | "complete">("questions");
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
    const [recommendedStrategy, setRecommendedStrategy] = useState<BreathingStrategy | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [sessionTime, setSessionTime] = useState(0);
    const [breathingPhase, setBreathingPhase] = useState<"inspire" | "segure" | "expire">("inspire");
    const [cycleCount, setCycleCount] = useState(0);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [lastVolume, setLastVolume] = useState(0.5);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Estados para o botão
    const [isButtonVisible, setIsButtonVisible] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);

    const [hasShownAudioPrompt, setHasShownAudioPrompt] = useState(false);
    const [showAudioPrompt, setShowAudioPrompt] = useState(false);

    // Novo estado para o toast de áudio
    const [showAudioToast, setShowAudioToast] = useState(false);

    // Efeito para mostrar/esconder o botão com o scroll
    useEffect(() => {
        if (step !== 'questions') {
            setIsButtonVisible(false);
            return;
        }
        const handleScroll = () => {
            const isScrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
            setIsButtonVisible(isScrolledToBottom);
        };
        handleScroll(); // Verifica a posição inicial
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [step]);

    // Efeito para sincronizar `isMuted` com o volume
    useEffect(() => {
        setIsMuted(volume === 0);
    }, [volume]);

    // Efeito para controlar o áudio
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = volume;
            if (isPlaying && step === 'session') {
                audio.play().catch(e => console.error("Audio play error:", e));
            } else {
                audio.pause();
            }
        }
    }, [volume, isPlaying, step]);

    useEffect(() => {
        if (step === 'session' && !hasShownAudioPrompt) {
            setHasShownAudioPrompt(true); // Marca como exibido para não mostrar de novo
            const showTimer = setTimeout(() => setShowAudioPrompt(true), 2000); // Mostra após 2s
            const hideTimer = setTimeout(() => setShowAudioPrompt(false), 7000); // Esconde após 5s (2+5)
            return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
        }
    }, [step, hasShownAudioPrompt]);

    // Novo efeito para mostrar o toast de áudio - sempre no início da sessão
    useEffect(() => {
        if (step === 'session') {
            const showToastTimer = setTimeout(() => {
                setShowAudioToast(true);
            }, 4000); // Mostra após 4 segundos para dar tempo do usuário se ambientar

            const hideToastTimer = setTimeout(() => {
                setShowAudioToast(false);
            }, 9000); // Esconde após 9 segundos (4+5)

            return () => {
                clearTimeout(showToastTimer);
                clearTimeout(hideToastTimer);
            };
        } else {
            setShowAudioToast(false);
        }
    }, [step]); // Só depende do step agora

    const stopSession = () => {
        setIsPlaying(false);
        setStep("questions");
        setHasShownAudioPrompt(false); // Reseta para a próxima sessão
        setShowAudioToast(false); // Esconde o toast
    };

    // Função de carregamento para iniciar a sessão
    const handleStartSession = () => {
        const canStart = selectedMood && selectedDuration && recommendedStrategy;
        if (!canStart || isPreparing) return;

        setIsPreparing(true);
        setTimeout(() => {
            setIsPlaying(true);
            setBreathingPhase("inspire");
            setCycleCount(0);
            setShowVolumeSlider(false);
            setSessionTime(selectedDuration!);
            setStep("session");
            setIsPreparing(false);
        }, 3000);
    };

    // Função para mutar/desmutar
    const handleToggleMute = () => {
        setShowVolumeSlider(false);
        setShowAudioToast(false); // Esconde o toast quando o usuário interage
        if (isMuted) {
            setVolume(lastVolume > 0 ? lastVolume : 0.5);
        } else {
            setLastVolume(volume);
            setVolume(0);
        }
    };

    // Função para abrir o controle de volume
    const handleVolumeClick = () => {
        setShowAudioToast(false); // Esconde o toast quando o usuário interage
        setShowVolumeSlider(v => !v);
    };

    // Lógicas de controle (timers, etc)
    useEffect(() => { if (selectedMood && selectedDuration) { const durationKey = selectedDuration <= 300 ? "short" : "long"; const strategyKey = `${selectedMood}-${durationKey}`; setRecommendedStrategy(breathingStrategies[strategyKey] || breathingStrategies["neutro-short"]); } else { setRecommendedStrategy(null); } }, [selectedMood, selectedDuration]);
    useEffect(() => { if (step !== "session" || !isPlaying) return; if (sessionTime <= 0) { setIsPlaying(false); setStep("complete"); setTimeout(() => { setStep("questions"); setSelectedMood(null); setSelectedDuration(null); setHasShownAudioPrompt(false); }, 3000); return; } const interval = setInterval(() => setSessionTime((prev) => prev - 1), 1000); return () => clearInterval(interval); }, [isPlaying, sessionTime, step]);
    useEffect(() => { if (step !== "session" || !isPlaying || !recommendedStrategy) return; const { pattern } = recommendedStrategy; const phaseDuration = pattern[breathingPhase] * 1000; const timer = setTimeout(() => { setBreathingPhase((currentPhase) => { if (currentPhase === "inspire") return "segure"; if (currentPhase === "segure") return "expire"; setCycleCount((prev) => prev + 1); return "inspire"; }); }, phaseDuration); return () => clearTimeout(timer); }, [isPlaying, breathingPhase, recommendedStrategy, step]);
    const formatTime = (seconds: number) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`; };
    const getPhaseText = () => { if (breathingPhase === "inspire") return "Inspire"; if (breathingPhase === "segure") return "Segure"; if (breathingPhase === "expire") return "Expire"; return ""; };
    const getBreathingScale = () => { if (breathingPhase === "inspire" || breathingPhase === "segure") return 1.3; return 0.75; };

    const renderContent = () => {
        switch (step) {
            case "session":
                if (!recommendedStrategy || !selectedDuration) return null;
                const phaseDuration = recommendedStrategy.pattern[breathingPhase];
                const gradient = durationGradients[selectedDuration] || "from-gray-500 to-gray-400";

                return (
                    <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen w-full flex flex-col bg-background text-foreground">
                        <audio ref={audioRef} loop src="https://ruofpmmujppmbkzwmpqd.supabase.co/storage/v1/object/public/audios//Wonder.mp3" />
                        <header className="p-4 pt-6 border-b"><div className="flex items-center justify-between"><Button variant="outline" size="icon" onClick={stopSession} className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button><div className="text-center"><h1 className="font-bold text-lg">{recommendedStrategy.name}</h1><p className="text-sm text-muted-foreground">{recommendedStrategy.description}</p></div><div className="w-10" /></div></header>
                        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center overflow-hidden"><p className="text-5xl font-light text-foreground mb-8">{formatTime(sessionTime)}</p><motion.div className="relative w-64 h-64" animate={{ scale: getBreathingScale() }} transition={{ duration: phaseDuration, ease: "easeInOut" }}><div className={cn("w-full h-full rounded-full bg-gradient-to-br flex items-center justify-center shadow-xl", gradient)}><div className="w-4/5 h-4/5 bg-white/20 rounded-full flex items-center justify-center"><div className="w-3/5 h-3/5 bg-white/30 rounded-full" /></div></div></motion.div><motion.div key={breathingPhase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-8"><p className="text-2xl font-medium">{getPhaseText()}</p><p className="text-muted-foreground text-sm">{phaseDuration / 1000} segundos</p></motion.div></main>
                        <footer className="p-6 pt-4 border-t"><div className="flex items-center justify-center gap-10 md:gap-16">
                            <div className="relative">
                                <Button variant="ghost" onClick={handleVolumeClick} className="flex flex-col h-auto p-1 text-muted-foreground relative">
                                    {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}<span className="text-xs mt-1">Som</span>

                                    {/* Toast "da o play" */}
                                    <AnimatePresence>
                                        {showAudioToast && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.8 }} 
                                                animate={{ opacity: 1, y: 0, scale: 1 }} 
                                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                className="absolute -top-16 left-1/4 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-medium shadow-lg whitespace-nowrap z-50"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Music className="w-4 h-4" />
                                                    <span>dá o play</span>
                                                </div>
                                                {/* Seta apontando para baixo */}
                                                <div className="absolute top-full transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary"></div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Button>
                                <AnimatePresence>{showVolumeSlider && (<motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="absolute bottom-full -translate-x-1/2 mb-4 bg-card p-4 rounded-2xl border shadow-2xl"><div className="w-2 h-28 flex items-center justify-center"><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-26 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary -rotate-90" /></div></motion.div>)}</AnimatePresence>
                            </div>
                            <Button size="lg" className="w-16 h-16 rounded-full bg-foreground text-background shadow-lg" onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}</Button>
                            <div className="text-center text-muted-foreground"><p className="font-bold text-lg text-foreground">{cycleCount + 1}</p><span className="text-xs">Ciclo</span></div>
                        </div></footer>
                    </motion.div>
                );
            case "questions":
                const canStart = selectedMood && selectedDuration && recommendedStrategy;
                return (
                    <div className="min-h-screen bg-background font-nunito">
                        <div className="max-w-4xl mx-auto pb-32">
                            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-950 dark:to-neutral-900 m-2 sm:m-4 rounded-3xl p-6 text-white relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div><div className="relative z-10"><h1 className="text-3xl font-extrabold">Reset Mental</h1><p className="text-white/70 mt-1">Uma pausa pra respirar e seguir em frente.</p></div></div><div className="p-4 sm:p-6 space-y-8"><motion.div><h3 className="font-bold text-xl text-foreground mb-4">E aí, como você tá se sentindo?</h3><div className="space-y-3">{[ { id: "ansioso", label: "Acelerado(a) & Ansioso(a)", icon: Zap }, { id: "cansado", label: "Cansado(a) & Sem Foco", icon: Cloudy }, { id: "neutro", label: "Só pra relaxar", icon: Smile }, ].map((mood) => (<Button key={mood.id} variant="outline" className={cn("w-full h-auto justify-start p-6 rounded-2xl border-2 transition-all text-base", selectedMood === mood.id ? "border-primary bg-primary/10" : "bg-card")} onClick={() => setSelectedMood(mood.id)}><mood.icon className={cn("w-6 h-6 mr-4", selectedMood === mood.id ? "text-primary" : "text-muted-foreground")} /> {mood.label}</Button>))}</div></motion.div><motion.div><h3 className="font-bold text-xl text-foreground mb-2">Quanto tempo você tem?</h3><div className="grid grid-cols-2 gap-4">{[ { duration: 180, label: "3 min" }, { duration: 300, label: "5 min" }, { duration: 600, label: "10 min" }, { duration: 900, label: "15 min" }, ].map((opt) => (<Button key={opt.duration} variant="outline" className={cn("h-20 flex-col gap-1 rounded-2xl border-2 text-base transition-all", selectedDuration === opt.duration ? "border-primary bg-primary/10" : "bg-card")} onClick={() => setSelectedDuration(opt.duration)}><Clock className={cn("w-5 h-5 mb-1", selectedDuration === opt.duration ? "text-primary" : "text-muted-foreground")} /> <span className="font-semibold">{opt.label}</span></Button>))}</div></motion.div><AnimatePresence>{recommendedStrategy && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-primary/10 rounded-2xl p-2 border border-primary/20"><div className="flex items-center gap-4 mb-2"><Sparkles className="w-5 h-5 text-primary" /><h4 className="font-bold text-foreground">Nossa sugestão pra você</h4></div><p className="text-muted-foreground text-sm">Baseado nas suas respostas, a técnica <strong>{recommendedStrategy.name}</strong> é a ideal para o momento.</p></motion.div>)}</AnimatePresence></div>
                        </div>

                        <AnimatePresence>
                            {isButtonVisible && (
                                <motion.div className="fixed bottom-12 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pb-8" initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }} transition={{ type: 'tween', ease: 'easeInOut', duration: 0.4 }}>
                                    <div className="max-w-4xl mx-auto">
                                        <Button size="lg" className="w-full h-14 essencia-valor text-lg rounded-2xl" disabled={!canStart || isPreparing} onClick={handleStartSession}>
                                            {isPreparing ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Preparando sua sessão...</>) : (canStart ? 'Fones no ouvido? Vamos começar!' : 'Escolha as opções acima')}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* Renderização condicional da BottomNavigation */}
                        {step === 'questions' && <BottomNavigation />}
                    </div>
                );
        }
    };

    return (
        <>
            <AnimatePresence mode="wait">
                {renderContent()}
            </AnimatePresence>
            <AnimatePresence>
                {step === "complete" && ( <motion.div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="bg-card rounded-3xl p-8 max-w-sm w-full text-center border" initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }} exit={{ scale: 0.8, y: 50 }}><motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { type: "spring", delay: 0.2 } }} className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6"><CheckCircle2 className="w-10 h-10 text-green-500" /></motion.div><h3 className="text-2xl font-bold text-foreground mb-2">Sessão Finalizada!</h3><p className="text-muted-foreground">Mandou bem! Você tirou um tempo pra cuidar de você. Faz toda a diferença.</p></motion.div></motion.div>)}
            </AnimatePresence>
        </>
    );
}