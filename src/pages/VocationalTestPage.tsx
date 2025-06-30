// src/pages/VocationalTestPage.tsx (VERSÃO FINAL UNIFICADA)

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, Profile } from "@/services/profileService";
import { motion, AnimatePresence } from "framer-motion";
import Showdown from "showdown";

// UI & Icons
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Brain,
    Lightbulb,
    RefreshCw,
    Rocket,
    Target,
    Users,
} from "lucide-react";

// Lógica e Dados (Certifique-se que os caminhos estão corretos no seu projeto)
import { questions } from "../data/questions";
import { getFinalAIAnalysis } from "../lib/geminiService";

// --- TIPOS E CONFIGURAÇÕES ---

type Screen =
    | "start"
    | "countdown"
    | "quiz"
    | "personal-info"
    | "loading"
    | "result";
type Scores = Record<"R" | "I" | "A" | "S" | "E" | "C", number>;
//const XP_PER_TEST = 50; // Recompensa em XP por completar o teste

// --- COMPONENTES DE SKELETON E HEADER ---

const VocationalTestSkeleton = () => (
    <div className="min-h-screen w-full bg-background animate-pulse">
        <header className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-48 bg-muted" />
                    </div>
                </div>
                <Skeleton className="h-12 w-12 rounded-full bg-muted" />
            </div>
        </header>
        <div className="flex items-center justify-center p-4 mt-10">
            <Skeleton className="h-96 w-full max-w-2xl rounded-2xl bg-muted" />
        </div>
    </div>
);

const VocationalTestHeader = ({ profile }: { profile: Profile | null }) => {
    const navigate = useNavigate();
    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-6 text-white relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                        aria-label="Voltar"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white">
                            Oráculo Vocacional
                        </h1>
                        <p className="text-white/70 text-sm">
                            Descubra seus superpoderes.
                        </p>
                    </div>
                </div>
                {profile && (
                    <img
                        src={
                            profile.avatar_url ||
                            `https://ui-avatars.com/api/?name=${profile.full_name?.split(" ")[0] || "A"}`
                        }
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                    />
                )}
            </div>
        </motion.div>
    );
};

// --- COMPONENTE PRINCIPAL ---

export function VocationalTestPage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    const [screen, setScreen] = useState<Screen>("start");
    const [countdown, setCountdown] = useState(2); // 2 segundos de suspense
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [scores, setScores] = useState<Scores>({
        R: 0,
        I: 0,
        A: 0,
        S: 0,
        E: 0,
        C: 0,
    });
    const [hobbies, setHobbies] = useState("");
    const [result, setResult] = useState("");
    const [htmlResult, setHtmlResult] = useState("");

    // Efeito para o countdown
    useEffect(() => {
        if (screen === "countdown" && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
        if (screen === "countdown" && countdown === 0) {
            setScreen("quiz");
        }
    }, [screen, countdown]);

    // Efeito para converter markdown em HTML quando o resultado chegar
    useEffect(() => {
        if (result) {
            const converter = new Showdown.Converter({
                simpleLineBreaks: true,
                openLinksInNewWindow: true,
            });
            setHtmlResult(converter.makeHtml(result));
        }
    }, [result]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (user) setProfile(await getProfile(user.id));
            } catch (error) {
                console.error("Erro ao carregar perfil:", error);
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchUserProfile();
    }, []);

    const handleStart = () => {
        setCountdown(2); // Inicia a contagem regressiva
        setScreen("countdown");
    };

    const handleRestart = () => {
        setScreen("start");
        setCurrentQuestionIndex(0);
        setScores({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
        setHobbies("");
        setResult("");
        setHtmlResult("");
    };

    const handleAnswer = (value: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        setScores((prev) => ({
            ...prev,
            [currentQuestion.type]: prev[currentQuestion.type] + value,
        }));

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        } else {
            setScreen("personal-info");
        }
    };

    const handleFinish = async () => {
        if (hobbies.trim().length < 10) {
            alert(
                "Conte um pouco mais sobre você para o Oráculo te entender melhor!",
            );
            return;
        }
        setScreen("loading");

        // Simula o suspense do carregamento
        setTimeout(async () => {
            const aiResult = await getFinalAIAnalysis(scores, hobbies);
            setResult(aiResult);
            // Lógica para dar XP (aqui você pode criar uma função RPC 'log_xp_gain' genérica)
            if (profile) {
                // Supondo que você tenha uma função genérica para dar XP
                // await supabase.rpc('log_xp_gain', { p_user_id: profile.id, p_xp_amount: XP_PER_TEST, p_source: 'VOCATIONAL_TEST' });
            }
            setScreen("result");
        }, 3000); // Atraso de 3 segundos para mostrar o resultado
    };

    const progress = useMemo(
        () => (currentQuestionIndex / questions.length) * 100,
        [currentQuestionIndex],
    );

    const loadingMessages = useMemo(
        () => [
            "Consultando o Oráculo...",
            "Analisando seus talentos...",
            "Mapeando seu futuro...",
            "Revelando seu potencial...",
        ],
        [],
    );
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (screen === "loading") {
            interval = setInterval(() => {
                setCurrentMessageIndex(
                    (prev) => (prev + 1) % loadingMessages.length,
                );
            }, 1500);
        }
        return () => clearInterval(interval);
    }, [screen, loadingMessages.length]);

    if (isLoadingProfile) {
        return <VocationalTestSkeleton />;
    }

    return (
        <div className="min-h-screen w-full bg-background font-nunito">
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                <VocationalTestHeader profile={profile} />

                <main className="flex items-center justify-center p-4 min-h-[60vh]">
                    <AnimatePresence mode="wait">
                        {screen === "start" && (
                            <motion.div
                                key="start"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-card p-6 md:p-14 rounded-3xl border shadow-lg text-center w-full max-w-2xl"
                            >
                                <motion.div
                                    className="w-24 h-24 bg-gradient-to-br from-primary to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                >
                                    <Target className="w-12 h-12 text-white" />
                                </motion.div>
                                <h1 className="text-2xl md:text-4xl font-extrabold text-foreground mb-4">
                                    Missão: Autoconhecimento
                                </h1>
                                <p className="text-muted-foreground mb-8 text-lg">
                                    Você está prestes a embarcar em uma jornada
                                    para descobrir seus superpoderes
                                    profissionais. Preparado(a)?
                                </p>
                                <Button
                                    onClick={handleStart}
                                    size="lg"
                                    className="text-lg font-bold px-12 py-7 rounded-xl shadow-lg w-full sm:w-auto"
                                >
                                    Começar a Missão
                                </Button>
                            </motion.div>
                        )}

                        {screen === "countdown" && (
                            <motion.div
                                key="countdown"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 2 }}
                                className="text-center"
                            >
                                <p className="text-muted-foreground text-2xl mb-4">
                                    Prepare-se...
                                </p>
                                <h1 className="text-8xl md:text-9xl font-extrabold text-primary">
                                    {countdown}
                                </h1>
                            </motion.div>
                        )}

                        {screen === "quiz" && (
                            <motion.div
                                key="quiz"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full max-w-2xl"
                            >
                                <div className="bg-card p-6 sm:p-10 rounded-2xl shadow-md border">
                                    <AnimatePresence mode="wait">
                                        <motion.h2
                                            key={currentQuestionIndex}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="text-xl md:text-2xl font-bold text-foreground min-h-[6rem] mb-8 text-center"
                                        >
                                            {
                                                questions[currentQuestionIndex]
                                                    .text
                                            }
                                        </motion.h2>
                                    </AnimatePresence>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Button
                                            onClick={() => handleAnswer(3)}
                                            className="bg-green-500 hover:bg-green-600 shadow-lg w-full sm:w-auto py-6 text-base"
                                        >
                                            Tudo a ver
                                        </Button>
                                        <Button
                                            onClick={() => handleAnswer(2)}
                                            className="bg-orange-500 hover:bg-orange-600 shadow-lg w-full sm:w-auto py-6 text-base"
                                        >
                                            Um pouco
                                        </Button>
                                        <Button
                                            onClick={() => handleAnswer(1)}
                                            className="bg-slate-400 hover:bg-slate-500 shadow-lg w-full sm:w-auto py-6 text-base"
                                        >
                                            Nada a ver
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <Progress
                                        value={progress}
                                        className="h-2 bg-muted [&>*]:bg-primary"
                                    />
                                    <p className="text-center text-sm text-muted-foreground mt-2">
                                        Missão {Math.round(progress)}% concluída
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {screen === "personal-info" && (
                            <motion.div
                                key="personal-info"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full max-w-2xl bg-card p-6 sm:p-10 rounded-2xl shadow-md border text-center"
                            >
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                                    O Toque Final!
                                </h2>
                                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                                    Para uma análise perfeita, conte (em detalhes!) para o
                                    Oráculo o que te move: hobbies, paixões, o
                                    que você ama fazer.
                                </p>
                                <Textarea
                                    value={hobbies}
                                    onChange={(e) => setHobbies(e.target.value)}
                                    rows={5}
                                    className="bg-background border-border focus:ring-primary text-base"
                                    placeholder="Ex: Amo games de estratégia, maratonar séries, lutar por um mundo mais justo, desenhar, tocar violão..."
                                />
                                <Button
                                    onClick={handleFinish}
                                    size="lg"
                                    className="mt-6 text-lg px-12 py-7 shadow-lg w-full sm:w-auto"
                                >
                                    Ver meu Resultado
                                </Button>
                            </motion.div>
                        )}

                        {screen === "loading" && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center"
                            >
                                <motion.div
                                    className="w-32 h-32 bg-gradient-to-br from-primary to-orange-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 180, 360],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                >
                                    <Brain className="w-16 h-16 text-white" />
                                </motion.div>
                                <AnimatePresence mode="wait">
                                    <motion.h3
                                        key={currentMessageIndex}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.5 }}
                                        className="text-2xl font-bold text-foreground"
                                    >
                                        {loadingMessages[currentMessageIndex]}
                                    </motion.h3>
                                </AnimatePresence>
                                <p className="text-muted-foreground mt-2">
                                    O Oráculo está decifrando seus
                                    superpoderes...
                                </p>
                            </motion.div>
                        )}

                        {screen === "result" && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full max-w-3xl text-center space-y-8"
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="relative overflow-hidden bg-card rounded-3xl shadow-xl border"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                                    <div className="relative p-6 sm:p-8">
                                        <div className="flex items-center justify-center mb-6">
                                            <div className="p-4 bg-primary rounded-full shadow-lg">
                                                <Lightbulb className="h-8 w-8 text-primary-foreground" />
                                            </div>
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                                            Oráculo Revelado: Seu Perfil
                                            Vocacional
                                        </h2>
                                        <div
                                            className="bg-background/50 p-6 rounded-2xl prose prose-slate dark:prose-invert max-w-none text-left border"
                                            dangerouslySetInnerHTML={{
                                                __html: htmlResult,
                                            }}
                                        />
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.4, type: "spring" }}
                                    className="bg-gradient-to-r from-primary to-orange-400 rounded-2xl shadow-lg p-6 text-primary-foreground"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-primary-foreground/20 rounded-lg shrink-0">
                                            <Users className="h-6 w-6 text-primary-foreground" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-lg mb-2">
                                                Próximo Passo: Aprofunde seus
                                                Insights
                                            </h3>
                                            <p className="text-primary-foreground/80 leading-relaxed">
                                                Este é o começo da sua jornada.
                                                Para explorar ainda mais seu
                                                potencial, participe dos{" "}
                                                <strong className="text-primary-foreground">
                                                    programas de mentoria do
                                                    Joule
                                                </strong>{" "}
                                                e transforme essas descobertas
                                                em ação!
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex flex-col sm:flex-row gap-4 justify-center"
                                >
                                    <Button
                                        onClick={handleRestart}
                                        size="lg"
                                        className="text-lg rounded-xl"
                                    >
                                        <RefreshCw className="mr-2 h-5 w-5" />
                                        Refazer Teste
                                    </Button>
                                    <Button
                                        onClick={() => navigate("/lab")}
                                        variant="outline"
                                        size="lg"
                                        className="text-lg rounded-xl"
                                    >
                                        <Rocket className="mr-2 h-5 w-5" />
                                        Voltar ao Lab
                                    </Button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
