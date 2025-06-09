// src/pages/LoginPage.tsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- MELHORIA ADICIONADA ---
  // Verifica se o usuário já tem uma sessão ativa ao carregar a página.
  // Se tiver, não faz sentido mostrar a tela de login para ele.
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Se já está logado, envia direto para o fluxo principal.
        navigate("/dashboard", { replace: true }); 
      }
    };
    checkSession();
  }, [navigate]);
  // O `replace: true` evita que o usuário possa usar o botão "voltar" do navegador para retornar à página de login.

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Lança o erro para ser pego pelo bloco catch
        throw error;
      }
      
      if (data.session) {
        toast.success("Login realizado com sucesso!");
        // Redirecionamento chave após o sucesso do login.
        // O ProtectedRoute vai assumir a partir daqui.
        navigate("/dashboard");
      }

    } catch (error: any) {
      // Mensagem de erro mais amigável para o usuário
      if (error.message.includes("Invalid login credentials")) {
        toast.error("E-mail ou senha incorretos. Verifique seus dados e tente novamente.");
      } else {
        toast.error("Ocorreu um erro. Por favor, tente mais tarde.");
      }
      console.error("Erro no login:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-52 h-22 flex items-center justify-center mb-2">
          <img 
            src="https://i.imgur.com/sxJhyH8.gif" 
            alt="Logo Tryla" 
            className="w-full h-auto"
          />
        </div>
        <p className="text-gray-500 mb-4">Continue a sua jornada!</p>

        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-center mb-6 text-slate-800">
            Que bom te ver de novo!
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // Suas classes de estilo estão ótimas
                className="w-full rounded-lg border text-gray-700 border-gray-300 p-3 h-11 focus:border-[#E36322] focus:outline-none focus:ring-1 focus:ring-[#E36322]"
                placeholder="seu.email@exemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border text-gray-700 border-gray-300 p-3 h-11 focus:border-[#E36322] focus:outline-none focus:ring-1 focus:ring-[#E36322]"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#E36322] hover:bg-[#E36322]/90 text-white font-semibold py-3 h-11 text-base"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/cadastro"
              className="text-sm text-[#E36322] hover:underline font-medium"
            >
              Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 text-center">
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Tryla. Feito com carinho priorizando seu aprendizado.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;