// src/pages/SettingsPage.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sun, Moon, Laptop } from "lucide-react";

// --- NOVA IMPORTAÇÃO ---
import NotificationManager from "@/components/NotificationManager";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Laptop },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center p-4 border-b bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="ml-4 text-xl font-bold">Configurações</h1>
      </header>

      <main className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="space-y-8">
          {" "}
          {/* Aumentei o espaço entre as seções */}
          {/* Seção de Aparência (código original) */}
          <section className="p-6 rounded-2xl bg-card border">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">
              Aparência
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Escolha como o aplicativo deve aparecer para você. "Sistema" usará
              a configuração do seu dispositivo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={theme === option.value ? "default" : "outline"}
                  onClick={() =>
                    setTheme(option.value as "light" | "dark" | "system")
                  }
                  className="w-full sm:w-auto flex-1 justify-center gap-2"
                >
                  <option.icon className="w-4 h-4" />
                  {option.label}
                </Button>
              ))}
            </div>
          </section>
          {/* --- NOVA SEÇÃO DE NOTIFICAÇÕES --- */}
          <NotificationManager />
          {/* Você pode adicionar mais seções de configurações aqui no futuro */}
        </div>
      </main>
    </div>
  );
}
