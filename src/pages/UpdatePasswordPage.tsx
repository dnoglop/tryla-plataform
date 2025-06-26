// ARQUIVO: src/pages/UpdatePasswordPage.tsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";

const UpdatePasswordPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [success, setSuccess] = useState(false); // Estado para mostrar a mensagem de sucesso

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem!", {
                description: "Por favor, verifique e tente novamente.",
            });
            return;
        }

        setLoading(true);

        try {
            // O Supabase já sabe quem é o usuário por causa do token no URL
            // que o onAuthStateChange já processou.
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            toast.success("Senha alterada com sucesso!");
            setSuccess(true);
        } catch (error: any) {
            toast.error("Erro ao atualizar a senha.", {
                description:
                    error.message ||
                    "Tente solicitar um novo link de redefinição.",
            });
            console.error("Erro ao atualizar senha:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={!success ? "Crie sua nova senha" : "Tudo pronto!"}
            description={
                !success
                    ? "Insira uma nova senha forte e segura para sua conta."
                    : "Sua senha foi atualizada com sucesso."
            }
        >
            {success ? (
                // --- Tela de Sucesso após a atualização ---
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-6">
                        Você já pode utilizar sua nova senha para acessar a
                        plataforma.
                    </p>
                    <Link
                        to="/login"
                        className="w-full inline-flex items-center justify-center py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90"
                    >
                        Prosseguir para o Login
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </motion.div>
            ) : (
                // --- Formulário para definir a nova senha ---
                <motion.form
                    onSubmit={handlePasswordUpdate}
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-foreground mb-2"
                        >
                            Nova Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-input border border-border rounded-xl placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="confirm-password"
                            className="block text-sm font-medium text-foreground mb-2"
                        >
                            Confirme a Nova Senha
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-input border border-border rounded-xl placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            "Salvar nova senha"
                        )}
                    </button>
                </motion.form>
            )}
        </AuthLayout>
    );
};

export default UpdatePasswordPage;
