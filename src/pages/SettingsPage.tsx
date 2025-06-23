// ARQUIVO: src/pages/SettingsPage.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

// Ícones necessários para a página
import { ArrowLeft, User, Palette, Moon, Sun, Laptop, ChevronRight, Key, HelpCircle, Info, LogOut } from "lucide-react";

// --- COMPONENTES AUXILIARES ESTILIZADOS ---
const SettingCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-card/80 dark:bg-black/20 backdrop-blur-md border border-border dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-lg ${className}`}>
    {children}
  </div>
);

const SettingItem: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; onClick?: () => void; }> = ({ icon: Icon, title, onClick }) => (
  <div 
    className="flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:bg-muted/50 dark:hover:bg-white/5 cursor-pointer group"
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
  </div>
);

// --- COMPONENTE PRINCIPAL ---
export const SettingsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Laptop },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    queryClient.clear();
    if (error) {
      toast.error("Erro ao sair da conta.");
    } else {
      toast.success("Até logo!");
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 dark:bg-black/20 backdrop-blur-md border-b border-border dark:border-white/10 px-4 py-4 z-10">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => navigate(-1)} aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        </div>
      </header>

      <main className="px-4 py-8 max-w-4xl mx-auto space-y-8">
        {/* Seção Perfil */}
        <SettingCard>
          <h2 className="text-lg font-bold text-foreground px-3 mb-2">Perfil</h2>
          <SettingItem icon={User} title="Editar informações do perfil" onClick={() => navigate('/editar-perfil')} />
        </SettingCard>

        {/* Seção Aparência */}
        <SettingCard>
            <h2 className="text-lg font-bold text-foreground px-3 mb-4">Aparência</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <Button
                    key={option.value}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                    className={`p-4 h-auto flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                      isActive ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </Button>
                );
              })}
            </div>
        </SettingCard>

        {/* Seção Conta */}
        <SettingCard>
          <h2 className="text-lg font-bold text-foreground px-3 mb-2">Conta</h2>
          <SettingItem icon={Key} title="Alterar Senha" onClick={() => navigate('/alterar-senha')} />
          {/* Adicione mais itens de conta aqui, se necessário */}
        </SettingCard>

        {/* Seção Suporte */}
        <SettingCard>
          <h2 className="text-lg font-bold text-foreground px-3 mb-2">Suporte</h2>
          <SettingItem icon={HelpCircle} title="Central de Ajuda" onClick={() => navigate('/ajuda')} />
          <SettingItem icon={Info} title="Sobre o aplicativo" onClick={() => navigate('/sobre')} />
        </SettingCard>

        {/* Botão de Logout */}
        <div className="pt-4">
            <Button
                variant="ghost"
                className="w-full justify-center gap-3 p-4 h-auto text-base font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
                onClick={handleLogout}
            >
                <LogOut className="h-5 w-5" />
                Sair da conta
            </Button>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;