// src/pages/SignupPage.tsx (Versão Final SEM Confirmação de Email)

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SignupPage = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Verifique se o gatilho SQL da resposta anterior foi criado.
  // Ele é responsável por criar o perfil automaticamente no backend.
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // A metadata é importante para o gatilho SQL criar o perfil com o nome correto
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("Este e-mail já está em uso. Tente fazer login.");
        } else {
          throw error;
        }
        // Retorna para não continuar a execução
        return;
      }

      // <<< MUDANÇA PRINCIPAL AQUI >>>
      // Como a confirmação está desativada, `data.user` e `data.session`
      // serão preenchidos imediatamente.
      if (data.user) {
        toast.success("Conta criada com sucesso!");

        // Redireciona o usuário para o dashboard.
        // O `ProtectedRoute` irá interceptar, ver que o onboarding não foi feito,
        // e redirecionar para a página correta (/onboarding).
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error("Erro no cadastro", {
        description: error.message || "Ocorreu um erro ao criar sua conta.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="w-48 mx-auto mb-4">
          <img
            src="https://i.imgur.com/sxJhyH8.gif"
            alt="Logo Tryla"
            className="w-full h-auto"
          />
        </div>
        <p className="text-gray-500 text-center mb-6">
          Comece sua jornada de aprendizado!
        </p>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/50">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 p-3 focus:border-trilha-orange focus:outline-none focus:ring-1 focus:ring-trilha-orange"
                placeholder="Seu nome completo"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 p-3 focus:border-trilha-orange focus:outline-none focus:ring-1 focus:ring-trilha-orange"
                placeholder="seu.email@exemplo.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 p-3 focus:border-trilha-orange focus:outline-none focus:ring-1 focus:ring-trilha-orange"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Confirmar senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 p-3 focus:border-trilha-orange focus:outline-none focus:ring-1 focus:ring-trilha-orange"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-trilha-orange text-white hover:bg-trilha-orange/90 font-semibold text-base"
              disabled={isLoading}
            >
              {isLoading ? "Criando conta..." : "Criar minha conta"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-slate-600">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="font-semibold text-trilha-orange hover:underline"
              >
                Faça o login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
