
import { useState } from "react";
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Apenas login, já que o cadastro agora é em outra página
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      navigate("/perfil");
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-32 h-32 mb-3 flex items-center justify-center">
          <img 
            src="https://i.imgur.com/TmfqRTD.gif" 
            alt="Logo Tryla" 
            className="w-full h-auto"
          />
        </div>
        <h1 className="text-2xl font-bold text-[#E36322] mb-1">Tryla</h1>
        <p className="text-gray-500 mb-8">Sua jornada de desenvolvimento pessoal</p>

        <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-center mb-6">
            Bem-vindo de volta!
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#E36322] hover:bg-[#E36322]/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/cadastro"
              className="text-sm text-[#E36322] hover:underline"
            >
              Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Tryla. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
