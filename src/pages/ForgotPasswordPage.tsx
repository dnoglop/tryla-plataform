// src/pages/ForgotPasswordPage.tsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";

const ForgotPasswordPage = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false); // Estado para mostrar a mensagem de sucesso

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSubmitted(false);

        try {
            // URL para onde o usuário será redirecionado após clicar no link do e-mail.
            // Esta página (geralmente chamada de 'update-password' ou 'reset-password')
            // é onde o usuário definirá a nova senha.
            const redirectTo = `${window.location.origin}/atualizar-senha`;

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectTo,
            });

            if (error) throw error;

            toast.success("Link de redefinição enviado!", {
                description: "Verifique sua caixa de entrada (e spam) para continuar.",
            });
            setSubmitted(true); // Mostra a mensagem de sucesso na tela
        } catch (error: any) {
            toast.error("Ocorreu um erro.", {
                description: "Não foi possível enviar o link. Verifique o e-mail e tente novamente.",
            });
            console.error("Erro na redefinição de senha:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Recuperar Senha"
            description={!submitted ? "Insira seu e-mail e enviaremos um link para você redefinir sua senha." : "Link enviado com sucesso!"}
        >
            {submitted ? (
                // --- Tela de Sucesso após o envio ---
                <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <p className="text-muted-foreground mb-6">
                        Se o e-mail <strong className="text-primary">{email}</strong> estiver cadastrado em nosso sistema, você receberá as instruções em breve.
                    </p>
                    <Link
                        to="/login"
                        className="w-full inline-flex items-center justify-center py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Voltar para o Login
                    </Link>
                </motion.div>
            ) : (
                // --- Formulário Inicial para solicitar o link ---
                <motion.form
                    onSubmit={handlePasswordReset}
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Seu e-mail de cadastro</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-input border border-border rounded-xl placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                            placeholder="seu.email@exemplo.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Enviar link de redefinição"}
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            Lembrou a senha? Voltar para o login
                        </Link>
                    </div>
                </motion.form>
            )}
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
