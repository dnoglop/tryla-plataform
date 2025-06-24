// ARQUIVO: src/components/Header.tsx (VERSÃO FINAL COM GRID LAYOUT)

import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonTarget?: string;
  rightContent?: React.ReactNode;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackClick,
  backButtonTarget,
  rightContent,
  className,
}) => {
  const navigate = useNavigate();

  const handleBackNavigation = () => {
    if (onBackClick) {
      onBackClick();
    } else if (backButtonTarget) {
      navigate(backButtonTarget);
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={cn(
        "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground relative z-20 shadow-md",
        "px-2 sm:px-4 py-3", // Padding ajustado
        className
      )}
    >
      <div className="container mx-auto">
        {/* Usando Grid para um controle perfeito do layout */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center w-full gap-2">

          {/* Coluna Esquerda: Botão de Voltar */}
          <div className="flex justify-start">
            {showBackButton && (
              <button
                onClick={handleBackNavigation}
                className="p-2 rounded-full hover:bg-white/10 transition-colors active:scale-95"
                aria-label="Voltar"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Coluna Central: Títulos */}
          <div className="text-center overflow-hidden">
            {subtitle && (
              <p className="text-xs sm:text-sm font-semibold text-white/80 truncate">
                {subtitle}
              </p>
            )}
            <h1 className="text-base sm:text-lg font-bold leading-tight truncate">
              {title}
            </h1>
          </div>

          {/* Coluna Direita: Conteúdo Extra */}
          <div className="flex justify-end">
            {rightContent}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;