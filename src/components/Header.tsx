// src/components/Header.tsx
import React from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; // Importe useNavigate

export interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void; // Função de callback customizada
  backButtonTarget?: string; // Destino específico para o Link/navigate
  rightContent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackClick,
  backButtonTarget, // Não precisa de valor padrão aqui, trataremos no uso
  rightContent,
}) => {
  const navigate = useNavigate();

  const handleBackNavigation = () => {
    if (backButtonTarget) {
      navigate(backButtonTarget);
    } else {
      navigate(-1); // Comportamento padrão se nenhum target for especificado
    }
  };

  const effectiveHandleBackClick = (e: React.MouseEvent) => {
    if (onBackClick) {
      e.preventDefault(); // Previne a navegação do Link se onBackClick for usado
      onBackClick();
    } else if (!backButtonTarget) {
      // Se não há onBackClick nem backButtonTarget, e o Link não tem um 'to' dinâmico,
      // podemos forçar a navegação aqui se o Link for apenas um ícone.
      // No entanto, com o Link tendo um 'to', isso pode ser redundante ou conflitante.
      // Vamos deixar o Link tratar a navegação se backButtonTarget for usado no 'to' do Link.
    }
  };

  // Determina o destino do Link
  const linkTo = backButtonTarget || (onBackClick ? "#" : "/modulos"); // Fallback para /modulos se nada mais for definido

  return (
    <header className="bg-[#e36322] text-white p-4 relative z-10 shadow-md">
      <div className="container mx-auto flex items-center justify-between h-10"> {/* Ajuste de altura e justificação */}
        <div className="flex items-center w-1/5"> {/* Espaço para o botão voltar */}
          {showBackButton && (
            onBackClick || backButtonTarget ? ( // Se temos uma ação customizada ou target, usamos um Button ou um Link que age como botão
              <button
                onClick={(e) => {
                  if (onBackClick) {
                    onBackClick();
                  } else if (backButtonTarget) {
                    navigate(backButtonTarget);
                  } else {
                    navigate(-1); // Fallback se por algum motivo chegou aqui
                  }
                }}
                className="mr-2 p-1 rounded hover:bg-white/20 transition-colors"
                aria-label="Voltar"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : ( // Se não, usa o Link com destino fixo (ou poderia ser navigate(-1) também)
              <Link to="/modulos" className="mr-2 p-1 rounded hover:bg-white/20 transition-colors" aria-label="Voltar para módulos">
                <ChevronLeft className="h-6 w-6" />
              </Link>
            )
          )}
        </div>
        
        <div className="flex-1 text-center px-2"> {/* Título centralizado e com espaço */}
          <h1 className="text-xl font-semibold truncate">{title}</h1>
        </div>

        <div className="flex items-center justify-end w-1/5"> {/* Espaço para conteúdo à direita */}
          {rightContent || <div className="w-6 h-6"></div> /* Placeholder para alinhar se não houver rightContent */}
        </div>
      </div>
    </header>
  );
};

export default Header;