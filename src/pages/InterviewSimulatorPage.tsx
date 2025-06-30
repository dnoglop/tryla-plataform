// src/pages/InterviewSimulatorPage.tsx (VERSÃO FINAL COMPLETA)

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, Profile } from "@/services/profileService";
import { motion, AnimatePresence } from "framer-motion";
import Showdown from "showdown";
import { cn } from "@/lib/utils";

// UI & Icons
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Bot,
    BrainCircuit,
    Loader2,
    Send,
    Lightbulb,
    Award,
    UploadCloud,
    FileText,
} from "lucide-react";

// Lógica de IA (verifique se o caminho está correto no seu projeto)
import {
    InterviewContext,
    generateInterviewQuestions,
    getAnswerFeedback,
} from "@/lib/interviewService";

// --- TIPOS E CONFIGURAÇÕES ---
type Screen = "setup" | "generating" | "interview" | "summary";
interface Message {
    id: number;
    sender: "ai" | "user" | "feedback";
    text: string;
}

// --- HEADER E SKELETON ---

const InterviewSimulatorHeader = ({ profile }: { profile: Profile | null }) => {
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
                            Modo Treino: Entrevista
                        </h1>
                        <p className="text-white/70 text-sm">
                            Encare o 'boss' sem medo.
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

const InterviewSimulatorSkeleton = () => (
    <div className="min-h-screen w-full bg-background animate-pulse">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <Skeleton className="h-28 rounded-3xl bg-muted" />
            <Skeleton className="h-[60vh] rounded-2xl bg-muted" />
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function InterviewSimulatorPage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [screen, setScreen] = useState<Screen>("setup");
    const [context, setContext] = useState<Omit<InterviewContext, "resume">>({
        company: "",
        level: "",
        jobDescription: "",
    });
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(
        null,
    );
    const [messages, setMessages] = useState<Message[]>([]);
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [isWaitingForFeedback, setIsWaitingForFeedback] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const converter = new Showdown.Converter({
        openLinksInNewWindow: true,
        simpleLineBreaks: true,
    });

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (user) setProfile(await getProfile(user.id));
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchUserProfile();
    }, []);

    useEffect(() => {
        return () => {
            if (uploadedFilePath) {
                supabase.storage.from("resumes").remove([uploadedFilePath]);
            }
        };
    }, [uploadedFilePath]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (screen === "generating" && questions.length > 0) {
            const timer = setTimeout(() => {
                setMessages([
                    {
                        id: 1,
                        sender: "ai",
                        text: `Olá! Sou seu treinador de entrevistas para a vaga na **${context.company}**. Estou aqui para te ajudar a brilhar. ✨\n\nQuando estiver pronto(a), vamos começar com a primeira pergunta.`,
                    },
                ]);
                setScreen("interview");
                setTimeout(() => askNextQuestion(), 500);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [screen, questions, context.company]);

    const uploadAndExtractText = async (file: File): Promise<string> => {
        setIsUploading(true);
        if (uploadedFilePath) {
            await supabase.storage.from("resumes").remove([uploadedFilePath]);
        }
        const fileName = `${profile!.id}/${Date.now()}.${file.name.split(".").pop()}`;
        const { error: uploadError } = await supabase.storage
            .from("resumes")
            .upload(fileName, file);
        if (uploadError) throw new Error("Falha no upload do currículo.");
        setUploadedFilePath(fileName);
        const { data, error: extractError } = await supabase.functions.invoke(
            "extract-pdf-text",
            { body: { filePath: fileName } },
        );
        if (extractError || data.error)
            throw new Error(extractError?.message || data.error);
        setIsUploading(false);
        return data.text;
    };

    const handleStartSimulation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resumeFile) {
            alert("Por favor, anexe seu currículo em PDF.");
            return;
        }
        try {
            setScreen("generating");
            const extractedResumeText = await uploadAndExtractText(resumeFile);
            const fullContext: InterviewContext = {
                ...context,
                resume: extractedResumeText,
            };
            const generatedQuestions =
                await generateInterviewQuestions(fullContext);
            setQuestions(generatedQuestions);
        } catch (error) {
            console.error(error);
            alert(
                "Ocorreu um erro ao processar seu currículo. Tente novamente.",
            );
            setScreen("setup");
        }
    };

    const askNextQuestion = () => {
        if (currentQuestionIndex < questions.length) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    sender: "ai",
                    text: questions[currentQuestionIndex],
                },
            ]);
        } else {
            setScreen("summary");
            const feedbackCount = messages.filter(
                (m) => m.sender === "feedback",
            ).length;
            const thumbsUpCount = messages.filter(
                (m) => m.sender === "feedback" && m.text.includes("👍"),
            ).length;
            setFinalScore(
                Math.round((thumbsUpCount / feedbackCount) * 100) || 75,
            );
        }
    };

    const handleSendAnswer = async () => {
        if (!userAnswer.trim()) return;
        setIsWaitingForFeedback(true);
        const currentAnswer = userAnswer;
        setUserAnswer("");
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), sender: "user", text: currentAnswer },
        ]);
        const feedback = await getAnswerFeedback(
            questions[currentQuestionIndex],
            currentAnswer,
            { ...context, resume: "" },
        );
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), sender: "feedback", text: feedback },
        ]);
        setIsWaitingForFeedback(false);
        setCurrentQuestionIndex((prev) => prev + 1);
        setTimeout(() => askNextQuestion(), 1000);
    };

    const loadingMessages = useMemo(
        () => [
            "Analisando a descrição da vaga...",
            "Cruzando informações com seu currículo...",
            "Elaborando perguntas desafiadoras...",
            "O recrutador virtual está se preparando...",
        ],
        [],
    );
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (screen === "generating") {
            interval = setInterval(
                () =>
                    setCurrentMessageIndex(
                        (prev) => (prev + 1) % loadingMessages.length,
                    ),
                1500,
            );
        }
        return () => clearInterval(interval);
    }, [screen, loadingMessages.length]);

    if (isLoadingProfile) {
        return <InterviewSimulatorSkeleton />;
    }

    return (
        <div className="min-h-screen w-full bg-background font-nunito">
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                <InterviewSimulatorHeader profile={profile} />
                <main className="min-h-[65vh] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {screen === "setup" && (
                            <motion.div
                                key="setup"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full"
                            >
                                <form
                                    onSubmit={handleStartSimulation}
                                    className="bg-card p-8 rounded-2xl border space-y-6"
                                >
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold text-foreground">
                                            Prepare sua Simulação
                                        </h2>
                                        <p className="text-muted-foreground mt-1">
                                            Preencha os dados e anexe seu
                                            currículo em PDF.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="company">
                                                Nome da Empresa
                                            </Label>
                                            <Input
                                                id="company"
                                                value={context.company}
                                                onChange={(e) =>
                                                    setContext({
                                                        ...context,
                                                        company: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="level">
                                                Nível da Vaga
                                            </Label>
                                            <Input
                                                id="level"
                                                value={context.level}
                                                onChange={(e) =>
                                                    setContext({
                                                        ...context,
                                                        level: e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="job-desc">
                                            Descrição da Vaga
                                        </Label>
                                        <Textarea
                                            id="job-desc"
                                            value={context.jobDescription}
                                            onChange={(e) =>
                                                setContext({
                                                    ...context,
                                                    jobDescription:
                                                        e.target.value,
                                                })
                                            }
                                            required
                                            rows={6}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="resume-upload">
                                            Seu Currículo (PDF)
                                        </Label>
                                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
                                            <div className="text-center">
                                                {resumeFile ? (
                                                    <>
                                                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                                        <p className="mt-2 text-sm font-semibold text-foreground">
                                                            {resumeFile.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {(
                                                                resumeFile.size /
                                                                1024
                                                            ).toFixed(1)}{" "}
                                                            KB
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setResumeFile(
                                                                    null,
                                                                )
                                                            }
                                                            className="text-sm text-red-500 hover:text-red-600 mt-2"
                                                        >
                                                            Trocar arquivo
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                                        <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                                                            <label
                                                                htmlFor="resume-upload"
                                                                className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                                                            >
                                                                <span>
                                                                    Carregue um
                                                                    arquivo
                                                                </span>
                                                                <input
                                                                    id="resume-upload"
                                                                    name="resume-upload"
                                                                    type="file"
                                                                    className="sr-only"
                                                                    accept=".pdf"
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        e.target
                                                                            .files &&
                                                                        setResumeFile(
                                                                            e
                                                                                .target
                                                                                .files[0],
                                                                        )
                                                                    }
                                                                />
                                                            </label>
                                                            <p className="pl-1">
                                                                ou arraste e
                                                                solte
                                                            </p>
                                                        </div>
                                                        <p className="text-xs leading-5 text-muted-foreground">
                                                            PDF até 5MB
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full !mt-8 py-6 text-lg"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        ) : (
                                            <BrainCircuit className="mr-2 h-5 w-5" />
                                        )}
                                        {isUploading
                                            ? "Processando Currículo..."
                                            : "Iniciar Simulação com IA"}
                                    </Button>
                                </form>
                            </motion.div>
                        )}
                        {screen === "generating" && (
                            <motion.div
                                key="generating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center p-10"
                            >
                                <motion.div
                                    className="w-24 h-24 bg-gradient-to-br from-primary to-orange-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 90, 180],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                >
                                    <Bot className="w-12 h-12 text-white" />
                                </motion.div>
                                <AnimatePresence mode="wait">
                                    <motion.h3
                                        key={currentMessageIndex}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.4 }}
                                        className="text-xl font-bold text-foreground"
                                    >
                                        {loadingMessages[currentMessageIndex]}
                                    </motion.h3>
                                </AnimatePresence>
                            </motion.div>
                        )}
                        {screen === "interview" && (
                            <motion.div
                                key="interview"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-card border rounded-2xl h-[70vh] flex flex-col w-full"
                            >
                                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "flex items-end gap-3",
                                                {
                                                    "justify-end":
                                                        msg.sender === "user",
                                                },
                                            )}
                                        >
                                            {msg.sender !== "user" && (
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center border">
                                                    {msg.sender === "ai" && (
                                                        <Bot className="w-6 h-6 text-primary" />
                                                    )}
                                                    {msg.sender ===
                                                        "feedback" && (
                                                        <Lightbulb className="w-6 h-6 text-green-500" />
                                                    )}
                                                </div>
                                            )}
                                            <div
                                                className={cn(
                                                    "max-w-md lg:max-w-lg p-4 rounded-2xl",
                                                    {
                                                        "bg-muted rounded-bl-none":
                                                            msg.sender !==
                                                                "user" &&
                                                            msg.sender !==
                                                                "feedback",
                                                        "bg-primary text-primary-foreground rounded-br-none":
                                                            msg.sender ===
                                                            "user",
                                                        "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800/50 rounded-bl-none":
                                                            msg.sender ===
                                                            "feedback",
                                                    },
                                                )}
                                            >
                                                <div
                                                    className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-2"
                                                    dangerouslySetInnerHTML={{
                                                        __html: converter.makeHtml(
                                                            msg.text,
                                                        ),
                                                    }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="p-4 border-t flex items-center gap-4 bg-background rounded-b-2xl">
                                    <Textarea
                                        placeholder="Digite sua resposta aqui..."
                                        value={userAnswer}
                                        onChange={(e) =>
                                            setUserAnswer(e.target.value)
                                        }
                                        disabled={isWaitingForFeedback}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" &&
                                                !e.shiftKey
                                            ) {
                                                e.preventDefault();
                                                handleSendAnswer();
                                            }
                                        }}
                                        rows={1}
                                        className="max-h-24"
                                    />
                                    <Button
                                        size="icon"
                                        onClick={handleSendAnswer}
                                        disabled={isWaitingForFeedback}
                                    >
                                        {isWaitingForFeedback ? (
                                            <Loader2 className="animate-spin" />
                                        ) : (
                                            <Send />
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                        {screen === "summary" && (
                            <motion.div
                                key="summary"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center p-8 bg-card rounded-2xl border w-full"
                            >
                                <Award className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                                <h2 className="text-3xl font-bold text-foreground">
                                    Simulação Concluída!
                                </h2>
                                <p className="text-muted-foreground mt-2 mb-6">
                                    Parabéns por completar o treino. Veja seu
                                    desempenho.
                                </p>
                                <div className="text-6xl font-bold text-primary mb-8">
                                    {finalScore}
                                    <span className="text-2xl text-muted-foreground">
                                        /100
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-left">
                                    Revisão da Entrevista:
                                </h3>
                                <div className="text-left space-y-4 max-h-80 overflow-y-auto p-4 bg-muted rounded-lg border">
                                    {messages
                                        .filter((m) => m.sender !== "ai")
                                        .reduce((acc, m, i) => {
                                            if (m.sender === "user") {
                                                acc.push(
                                                    <div
                                                        key={m.id}
                                                        className="p-3 rounded-lg border bg-background"
                                                    >
                                                        <p className="font-bold text-primary">
                                                            {
                                                                questions[
                                                                    acc.length
                                                                ]
                                                            }
                                                        </p>
                                                        <p className="mt-2 text-sm text-foreground">
                                                            {m.text}
                                                        </p>
                                                        <div
                                                            className="mt-2 prose prose-sm dark:prose-invert"
                                                            dangerouslySetInnerHTML={{
                                                                __html: converter.makeHtml(
                                                                    messages[
                                                                        i + 2
                                                                    ]?.text ||
                                                                        "",
                                                                ),
                                                            }}
                                                        ></div>
                                                    </div>,
                                                );
                                            }
                                            return acc;
                                        }, [] as JSX.Element[])}
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <Button
                                        size="lg"
                                        onClick={() => navigate("/lab")}
                                        className="flex-1"
                                    >
                                        Voltar ao Lab
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={handleRestart}
                                        className="flex-1"
                                    >
                                        Nova Simulação
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
