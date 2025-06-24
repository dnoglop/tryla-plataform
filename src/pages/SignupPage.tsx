// src/pages/SignupPage.tsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Ícones
import { Loader2, HelpCircle } from "lucide-react";
import GoogleIcon from "@/components/icons/GoogleIcon";

// Componentes da UI (incluindo o novo Tooltip)
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";


// --- COMPONENTES DE UI REUTILIZÁVEIS ---

const BottomGradient = () => (
    <>
        <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
        <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-[hsl(var(--primary))] to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
);

const LabelInputContainer = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
        {children}
    </div>
);

// --- COMPONENTE PRINCIPAL DA PÁGINA DE CADASTRO ---

const SignupPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Função para validar o formato do e-mail
    const isValidEmail = (email: string) => {
        // Regex simples para verificação de formato de e-mail
        const emailRegex = /\S+@\S+\.\S+/;
        return emailRegex.test(email);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        // --- Validações ---
        if (!fullName.trim()) {
            toast.error("Por favor, preencha seu nome completo.");
            return;
        }
        if (!isValidEmail(email)) {
            toast.error("Por favor, insira um endereço de e-mail válido.");
            return;
        }
        if (password.length < 6) {
            toast.error("Sua senha deve ter pelo menos 6 caracteres.");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem. Verifique novamente.");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName.trim() } },
            });
            if (error) throw error;
            toast.success("Verifique seu e-mail!", {
                description: "Enviamos um link de confirmação para você. Após confirmar, faça o login.",
            });
            navigate("/login");
        } catch (error: any) {
            if (error.message.includes("User already registered")) {
                toast.error("Este e-mail já está em uso.", { description: "Tente fazer login ou use um e-mail diferente." });
            } else {
                toast.error("Erro ao criar sua conta.", { description: error.message || "Por favor, tente novamente." });
            }
            console.error("Erro no cadastro:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        // ... (lógica do login com Google permanece a mesma)
    };

    return (
        <div className="min-h-screen w-full animated-gradient-bg flex flex-col items-center justify-center p-4 font-nunito">
            <div className="w-48 mx-auto mb-4">
                <img src="https://i.imgur.com/sxJhyH8.gif" alt="Logo Tryla" className="w-full h-auto" />
            </div>
            <TooltipProvider> {/* Provider para habilitar os tooltips dentro do formulário */}
                <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-card p-8 border">
                    <h2 className="text-xl text-center font-bold text-foreground">
                        Comece sua jornada
                    </h2>
                    <p className="mt-2 max-w-sm text-sm text-center text-muted-foreground">
                        Crie sua conta e dê o primeiro passo para o sucesso.
                    </p>

                    <form className="my-8" onSubmit={handleSignup}>
                        <LabelInputContainer className="mb-4">
                            <div className="flex items-center gap-2">
                                <label htmlFor="fullName">Nome completo</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Seu nome real será exibido em seu perfil e na comunidade.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <input id="fullName" placeholder="Seu nome e sobrenome" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isLoading} className="h-10 w-full border-none bg-input text-foreground rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
                        </LabelInputContainer>

                        <LabelInputContainer className="mb-4">
                            <div className="flex items-center gap-2">
                                <label htmlFor="email">E-mail</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Use seu melhor e-mail para login e notificações.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <input id="email" placeholder="seu.email@exemplo.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="h-10 w-full border-none bg-input text-foreground rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
                        </LabelInputContainer>

                        <LabelInputContainer className="mb-4">
                            <div className="flex items-center gap-2">
                                <label htmlFor="password">Crie uma senha</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Mínimo de 6 caracteres. Use uma senha forte!</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <input id="password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="h-10 w-full border-none bg-input text-foreground rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
                        </LabelInputContainer>

                        <LabelInputContainer className="mb-8">
                            <label htmlFor="confirmPassword">Confirme sua senha</label>
                            <input id="confirmPassword" placeholder="••••••••" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading} className="h-10 w-full border-none bg-input text-foreground rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
                        </LabelInputContainer>

                        <button
                            className="group/btn relative block h-10 w-full rounded-md bg-primary font-semibold text-primary-foreground shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Criar minha conta →"}
                            <BottomGradient />
                        </button>
                    </form>

                    <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-border to-transparent" />

                    <div className="flex flex-col space-y-4">
                        <button
                            className="group/btn shadow-input relative flex h-10 w-full items-center justify-center space-x-2 rounded-md bg-background px-4 font-medium text-foreground transition-colors hover:bg-accent"
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <GoogleIcon className="h-4 w-4" />
                            <span className="text-sm">Cadastrar com Google</span>
                            <BottomGradient />
                        </button>
                    </div>
                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        Já tem uma conta?{" "}
                        <Link to="/login" className="font-semibold text-primary hover:underline">
                            Faça o login
                        </Link>
                    </div>
                </div>
            </TooltipProvider>
        </div>
    );
};

export default SignupPage;