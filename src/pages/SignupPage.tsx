
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
        description: "Faça o seu login para começar a explorar!",
      });
      
      // Redirecionar para o perfil após o login
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
    <div className="flex-1 flex flex-col items-center justify-center p-2 from-amber-50">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
      {/* Logo centralizada */}
      <div className="w-52 h-22 flex items-center justify-center mb-4">
        <img 
          src="https://i.imgur.com/sxJhyH8.gif" 
          alt="Logo Tryla" 
          className="w-full h-auto"
        />
      </div>
        <p className="text-gray-500 mb-4">Comece sua jornada de aprendizado!</p>

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
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#E36322] focus:outline-none focus:ring-2 focus:ring-[#E36322] focus:ring-opacity-20"
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
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#E36322] focus:outline-none focus:ring-2 focus:ring-[#E36322] focus:ring-opacity-20"
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
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#E36322] focus:outline-none focus:ring-2 focus:ring-[#E36322] focus:ring-opacity-20"
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
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#E36322] focus:outline-none focus:ring-2 focus:ring-[#E36322] focus:ring-opacity-20"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-[#E36322] text-white hover:bg-[#E36322]/90"
              disabled={isLoading}
            >
              {isLoading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <p>
              Já tem uma conta?{" "}
              <Link to="/login" className="font-semibold text-[#E36322] hover:underline">
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

      <div className="bg-[#E36322] h-2" />
    </div>
  );
};

export default SignupPage;
