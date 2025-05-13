
import { ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showNotifications?: boolean;
  rightContent?: React.ReactNode;
  onBackClick?: () => void; // Adicionando esta prop
}

const Header = ({ 
  title, 
  showBackButton = true,
  showNotifications = true,
  rightContent,
  onBackClick // Usando a nova prop
}: HeaderProps) => {
  const navigate = useNavigate();

  // Função para lidar com o clique no botão de voltar
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button 
              onClick={handleBackClick}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-[#E36322]" />
            </button>
          )}
          <h1 className="text-xl font-bold text-black">{title}</h1>
        </div>
        {rightContent ? rightContent : (
          showNotifications && (
            <button className="relative rounded-full p-2 hover:bg-gray-100">
              <Bell className="h-5 w-5 text-[#E36322]" />
              <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#E36322] text-[8px] text-white">
                3
              </span>
            </button>
          )
        )}
      </div>
    </header>
  );
};

export default Header;
