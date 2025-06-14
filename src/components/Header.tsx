
import React from "react";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ProgressIndicator } from "@/components/navigation/ProgressIndicator";
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonTarget?: string;
  rightContent?: React.ReactNode;
  subtitle?: string;
  progress?: {
    current: number;
    total: number;
    variant?: 'dots' | 'line' | 'minimal';
  };
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackClick,
  backButtonTarget,
  rightContent,
  subtitle,
  progress,
  className,
}) => {
  const navigate = useNavigate();
  const { smartGoBack } = useNavigationContext();

  const handleBackNavigation = () => {
    if (onBackClick) {
      onBackClick();
    } else if (backButtonTarget) {
      navigate(backButtonTarget);
    } else {
      smartGoBack();
    }
  };

  return (
    <header className={cn(
      "bg-gradient-to-r from-primary to-primary/90 text-white relative z-10",
      "shadow-lg backdrop-blur-sm",
      className
    )}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Seção esquerda - Botão voltar */}
          <div className="flex items-center min-w-[40px]">
            {showBackButton && (
              <button
                onClick={handleBackNavigation}
                className="p-2 rounded-full hover:bg-white/20 transition-colors active:scale-95"
                aria-label="Voltar"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Seção central - Título e contexto */}
          <div className="flex-1 text-center px-4">
            <h1 className="text-lg font-bold truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-white/80 truncate mt-0.5">
                {subtitle}
              </p>
            )}
            {progress && (
              <div className="mt-2">
                <ProgressIndicator
                  currentStep={progress.current}
                  totalSteps={progress.total}
                  variant={progress.variant}
                  className="justify-center"
                />
              </div>
            )}
          </div>

          {/* Seção direita - Conteúdo customizado */}
          <div className="flex items-center justify-end min-w-[40px]">
            {rightContent || (
              <div className="w-10 h-10 flex items-center justify-center">
                {/* Placeholder para manter alinhamento */}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
