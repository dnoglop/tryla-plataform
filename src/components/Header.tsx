
import { ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showNotifications?: boolean;
  rightContent?: React.ReactNode;
}

const Header = ({ 
  title, 
  showBackButton = true,
  showNotifications = true,
  rightContent
}: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 w-full bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button 
              onClick={() => navigate(-1)}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        {rightContent ? rightContent : (
          showNotifications && (
            <button className="relative rounded-full p-2 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#e36322] text-[8px] text-white">
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
