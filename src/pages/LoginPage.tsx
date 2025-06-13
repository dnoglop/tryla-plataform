
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      if (data.session) {
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      }

    } catch (error: any) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("E-mail ou senha incorretos.", {
            description: "Verifique seus dados e tente novamente."
        });
      } else {
        toast.error("Ocorreu um erro ao fazer login.", {
            description: "Por favor, tente novamente mais tarde."
        });
      }
      console.error("Erro no login:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-52 h-22 flex items-center justify-center mb-2">
          <img
            src="https://i.imgur.com/sxJhyH8.gif"
            alt="Logo Tryla"
            className="w-full h-auto"
          />
        </div>
        <p className="text-muted-foreground mb-4">Continue a sua jornada!</p>

        <div className="w-full max-w-sm bg-card rounded-xl shadow-sm p-6 border">
          <h2 className="text-xl font-bold text-center mb-6 text-foreground">
            Que bom te ver de novo!
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border p-3 h-11 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="seu.email@exemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border p-3 h-11 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 h-11 text-base"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin"/>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/cadastro"
              className="text-sm text-primary hover:underline font-medium"
            >
              Não tem uma conta? Cadastre-se!
            </Link>
          </div>
        </div>
      </div>
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Tryla. Feito com carinho priorizando seu aprendizado.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
