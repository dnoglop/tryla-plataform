// src/pages/AuthPage.tsx

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import GoogleIcon from "@/components/icons/GoogleIcon";
import { AuthLayout } from "@/components/AuthLayout"; // Reutilizando nosso layout!

// --- Variantes de Animação ---
const formContainerVariants = {
  hidden: { opacity: 0, x: 50, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { opacity: 0, x: -50, transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Hook para ler a URL atual

    // --- Estado para controlar se é Login ou Cadastro ---
    const [isLogin, setIsLogin] = useState(location.pathname === '/login');
    const [loading, setLoading] = useState(false);

    // --- Estados para todos os campos de ambos os formulários ---
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Atualiza o modo (login/cadastro) se a URL mudar
    useEffect(() => {
        setIsLogin(location.pathname === '/login');
    }, [location.pathname]);

    // Redireciona se o usuário já estiver logado
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) navigate("/inicio", { replace: true });
        };
        checkSession();
    }, [navigate]);

    // --- Lógicas de Submissão (ambas no mesmo arquivo) ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            toast.success("Login realizado com sucesso!");
            navigate("/inicio");
        } catch (error: any) {
            toast.error("E-mail ou senha incorretos.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem."); return;
        }
        if (password.length < 6) {
            toast.error("A senha deve ter no mínimo 6 caracteres."); return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName.trim() } } });
            if (error) throw error;
            toast.success("Verifique seu e-mail!", { description: "Enviamos um link de confirmação para você." });
            navigate("/login"); // Navega para o login após o sucesso
        } catch (error: any) {
            if (error.message.includes("User already registered")) {
                toast.error("Este e-mail já está em uso.");
            } else {
                toast.error("Erro ao criar sua conta.", { description: error.message });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => { /* ... sua lógica ... */ };

    return (
        <AuthLayout
            title={isLogin ? "Que bom te ver de novo!" : "Comece sua jornada"}
            description={isLogin ? "Faça o login para continuar." : "Crie sua conta para começar."}
        >
            {/* O AnimatePresence é a chave para a transição suave */}
            <AnimatePresence mode="wait">
                {isLogin ? (
                    // --- Formulário de LOGIN ---
                    <motion.form
                        key="login"
                        onSubmit={handleLogin}
                        className="space-y-6"
                        variants={formContainerVariants}
                        initial="hidden" animate="visible" exit="exit"
                    >
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-input border border-border rounded-xl placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="seu.email@exemplo.com" required disabled={loading} />
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline mb-2">
                                <label className="block text-sm font-medium text-foreground">Senha</label>
                                <Link to="/esqueci-senha" className="text-sm text-primary hover:underline transition-colors">Esqueceu a senha?</Link>
                            </div>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-input border border-border rounded-xl placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="••••••••" required disabled={loading} />
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center space-x-2">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Entrar</span><ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </motion.form>
                ) : (
                    // --- Formulário de CADASTRO ---
                    <motion.form
                        key="signup"
                        onSubmit={handleSignup}
                        className="space-y-4"
                        variants={formContainerVariants}
                        initial="hidden" animate="visible" exit="exit"
                    >
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Nome Completo</label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 bg-input border border-border rounded-xl placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="Seu nome e sobrenome" required disabled={loading} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-input border border-border rounded-xl placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="seu.email@exemplo.com" required disabled={loading} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Crie uma senha</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-input border border-border rounded-xl placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="Mínimo de 6 caracteres" required minLength={6} disabled={loading} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Confirme a senha</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-input border border-border rounded-xl placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                placeholder="Repita a senha" required disabled={loading} />
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center space-x-2 !mt-6">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Criar minha conta</span><ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Divisor e Botão Google (comuns a ambos) */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-card text-muted-foreground">ou</span></div>
            </div>
            <button type="button" onClick={handleGoogleLogin} disabled={loading}
                className="w-full py-3 border border-border bg-background rounded-xl font-medium text-foreground hover:bg-accent transition-all flex items-center justify-center space-x-2 disabled:opacity-50">
                <GoogleIcon className="w-5 h-5" />
                <span>{isLogin ? "Entrar com Google" : "Cadastrar com Google"}</span>
            </button>

            {/* Link para alternar entre os formulários */}
            <div className="text-center mt-8 text-muted-foreground">
                {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
                <Link 
                    to={isLogin ? "/cadastro" : "/login"} 
                    className="font-semibold text-primary hover:underline"
                    // Opcional: onClick={() => setIsLogin(!isLogin)} para uma transição ainda mais rápida sem depender da mudança de rota
                >
                    {isLogin ? "Cadastre-se agora" : "Faça o login"}
                </Link>
            </div>
        </AuthLayout>
    );
};

export default AuthPage;