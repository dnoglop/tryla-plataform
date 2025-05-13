
import React from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

export interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightContent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, showBackButton = false, onBackClick, rightContent }) => {
  const handleBackClick = (e: React.MouseEvent) => {
    if (onBackClick) {
      e.preventDefault();
      onBackClick();
    }
  };

  return (
    <header className="bg-[#e36322] text-white p-4 relative z-10">
      <div className="container mx-auto flex items-center">
        {showBackButton && (
          <Link to="#" onClick={handleBackClick} className="mr-2">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        )}
        <h1 className="text-xl font-medium flex-1 text-center">{title}</h1>
        {rightContent && <div className="ml-auto">{rightContent}</div>}
      </div>
    </header>
  );
};

export default Header;
