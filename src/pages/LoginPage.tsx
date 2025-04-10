
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulando login
    navigate("/dashboard");
  };

  const handleGoogleLogin = () => {
    // Simulando login com Google
    navigate("/dashboard");
  };

  const handleLinkedInLogin = () => {
    // Simulando login com LinkedIn
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1 px-6 py-12 md:px-12">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight">
            Na <span className="text-trilha-orange">Trilha</span>
          </h1>
          <p className="text-lg text-gray-600">Chega mais, explorador(a)!</p>
        </div>

        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="grid grid-cols-1 gap-3">
            <Button 
              onClick={handleGoogleLogin} 
              variant="outline"
              className="flex items-center gap-2 h-12"
            >
              <img 
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" 
                alt="Google"
                className="h-5 w-5" 
              />
              <span>Continuar com Google</span>
            </Button>

            <Button 
              onClick={handleLinkedInLogin}
              variant="outline"
              className="flex items-center gap-2 h-12"
            >
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span>Continuar com LinkedIn</span>
            </Button>
          </div>

          <div className="relative flex items-center py-2">
            <Separator className="flex-1" />
            <span className="mx-2 text-xs text-gray-400">OU</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <Link to="/esqueci-senha" className="text-xs text-trilha-orange hover:underline">
                  Esqueceu?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-trilha-orange focus:outline-none focus:ring-2 focus:ring-trilha-orange focus:ring-opacity-20"
                placeholder="••••••••"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-trilha-orange text-white hover:bg-trilha-orange/90"
            >
              Entrar
            </Button>
          </form>

          <div className="text-center text-sm">
            <p>
              Ainda não tem conta?{" "}
              <Link to="/cadastro" className="font-semibold text-trilha-orange hover:underline">
                Cadastre-se
              </Link>
            </p>
            
            <Button 
              onClick={() => navigate("/dashboard")} 
              variant="link" 
              className="mt-4 text-gray-500"
            >
              <span>Ver uma prévia</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-trilha-orange h-2" />
    </div>
  );
};

export default LoginPage;
