import React from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonTarget?: string;
  rightContent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackClick,
  backButtonTarget,
  rightContent,
}) => {
  const navigate = useNavigate();

  // Função para lidar com a navegação de volta
  const handleBackNavigation = () => {
    // Se um callback customizado for fornecido, use-o
    if (onBackClick) {
      onBackClick();
    // Se um destino específico for fornecido, navegue para lá
    } else if (backButtonTarget) {
      navigate(backButtonTarget);
    // Senão, use o comportamento padrão de voltar no histórico
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="bg-[#e36322] text-white p-4 relative z-10 shadow-md">
      <div className="container mx-auto flex items-center justify-between h-10">
        {/* Espaço para o botão voltar */}
        <div className="flex items-center w-1/5">
          {showBackButton && (
            <button
              onClick={handleBackNavigation}
              className="mr-2 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
        </div>
        
        {/* Título centralizado e com espaço */}
        <div className="flex-1 text-center px-2">
          <h1 className="text-xl font-semibold truncate">{title}</h1>
        </div>

        {/* Espaço para conteúdo à direita */}
        <div className="flex items-center justify-end w-1/s">
          {rightContent || <div className="w-10 h-10"></div> /* Placeholder para alinhar */}
        </div>
      </div>
    </header>
  );
};

export default Header;