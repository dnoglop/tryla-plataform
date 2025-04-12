import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Registrar usuário no Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      // Sucesso no cadastro
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar sua conta",
      });
      
      // Redirecionar para o dashboard (ou login, dependendo do fluxo desejado)
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao criar sua conta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao tentar entrar com Google",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1 px-6 py-12 md:px-12">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight">
            Na <span className="text-trilha-orange">Trilha</span>
          </h1>
          <p className="text-lg text-gray-600">Crie sua conta de explorador(a)!</p>
        </div>

        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="grid grid-cols-1 gap-3">
            <Button 
              onClick={handleGoogleSignup} 
              variant="outline"
              className="flex items-center gap-2 h-12"
              disabled={isLoading}
            >
              <img 
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" 
                alt="Google"
                className="h-5 w-5" 
              />
              <span>Continuar com Google</span>
            </Button>
          </div>

          <div className="relative flex items-center py-2">
            <Separator className="flex-1" />
            <span className="mx-2 text-xs text-gray-400">OU</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-trilha-orange focus:outline-none focus:ring-2 focus:ring-trilha-orange focus:ring-opacity-20"
                placeholder="Seu nome completo"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-trilha-orange focus:outline-none focus:ring-2 focus:ring-trilha-orange focus:ring-opacity-20"
                placeholder="seu@email.com"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-trilha-orange focus:outline-none focus:ring-2 focus:ring-trilha-orange focus:ring-opacity-20"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-trilha-orange focus:outline-none focus:ring-2 focus:ring-trilha-orange focus:ring-opacity-20"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-trilha-orange text-white hover:bg-trilha-orange/90"
              disabled={isLoading}
            >
              {isLoading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <p>
              Já tem uma conta?{" "}
              <Link to="/login" className="font-semibold text-trilha-orange hover:underline">
                Faça login
              </Link>
            </p>
            
            <Button 
              asChild
              variant="link" 
              className="mt-4 text-gray-500"
              disabled={isLoading}
            >
              <Link to="/login">
                <ArrowLeft className="mr-1 h-4 w-4" />
                <span>Voltar ao login</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-trilha-orange h-2" />
    </div>
  );
};

export default SignupPage;
