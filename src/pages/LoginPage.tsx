// src/pages/LoginPage.tsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Ícones (você pode usar 'lucide-react' ou instalar '@tabler/icons-react' como na inspiração)
import { Loader2 } from "lucide-react";
import GoogleIcon from "@/components/icons/GoogleIcon"; // Vamos criar este componente simples

// --- COMPONENTES DE UI INSPIRADOS EM ACETERNITY ---

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

// --- COMPONENTE PRINCIPAL DA PÁGINA DE LOGIN ---

const LoginPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Redireciona se o usuário já estiver logado
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate("/inicio", { replace: true });
            }
        };
        checkSession();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (data.session) {
                toast.success("Login realizado com sucesso!");
                navigate("/inicio");
            }
        } catch (error: any) {
            toast.error("E-mail ou senha incorretos.", {
                description: "Verifique seus dados e tente novamente."
            });
            console.error("Erro no login:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/inicio` },
        });
        if (error) {
            toast.error("Erro ao fazer login com o Google.", {
                description: "Por favor, tente novamente mais tarde."
            });
        }
    };

    return (
        <div className="min-h-screen w-full animated-gradient-bg flex flex-col items-center justify-center p-4 font-nunito">
            <div className="w-48 mx-auto mb-4">
                <img src="https://i.imgur.com/sxJhyH8.gif" alt="Logo Tryla" className="w-full h-auto" />
            </div>
            <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-card p-8 border">
                <h2 className="text-xl text-center font-bold text-foreground">
                    Que bom te ver de novo!
                </h2>
                <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                    Faça o login para continuar sua jornada de sucesso.
                </p>

                <form className="my-8" onSubmit={handleLogin}>
                    <LabelInputContainer className="mb-4">
                        <label htmlFor="email">E-mail</label>
                        <input
                            id="email"
                            placeholder="seu.email@exemplo.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="h-10 w-full border-none bg-input text-foreground rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        />
                    </LabelInputContainer>
                    <LabelInputContainer className="mb-4">
                        <div className="flex justify-between items-center">
                            <label htmlFor="password">Senha</label>
                            <Link to="/esqueci-senha" className="text-xs font-medium text-primary hover:underline">
                                Esqueci minha senha
                            </Link>
                        </div>
                        <input
                            id="password"
                            placeholder="••••••••"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="h-10 w-full border-none bg-input text-foreground rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        />
                    </LabelInputContainer>

                    <button
                        className="group/btn relative block h-10 w-full rounded-md bg-primary font-semibold text-primary-foreground shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Entrar →"}
                        <BottomGradient />
                    </button>
                </form>

                <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-border to-transparent" />

                <div className="flex flex-col space-y-4">
                    <button
                        className="group/btn shadow-input relative flex h-10 w-full items-center justify-center space-x-2 rounded-md bg-background px-4 font-medium text-foreground transition-colors hover:bg-accent"
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        <GoogleIcon className="h-4 w-4" />
                        <span className="text-sm">Entrar com Google</span>
                        <BottomGradient />
                    </button>
                </div>
                 <div className="mt-8 text-center text-sm text-muted-foreground">
                    Não tem uma conta?{" "}
                    <Link to="/cadastro" className="font-semibold text-primary hover:underline">
                        Cadastre-se agora
                    </Link>
                </div>
            </div>
            <footer className="py-4 mt-4 text-center text-xs text-muted-foreground/80">
                © {new Date().getFullYear()} Tryla. Feito com carinho para o seu futuro.
            </footer>
        </div>
    );
};

export default LoginPage;