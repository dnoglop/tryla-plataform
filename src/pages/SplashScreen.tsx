import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  const handleStart = () => {
    setFadeOut(true);
    setTimeout(() => {
      navigate("/login");
    }, 500); // Tempo da animação de fade out
  };

  return (
    <div 
      className={`min-h-screen bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center justify-center space-y-8 p-6 max-w-md mx-auto text-center">
        {/* Logo do Tryla */}
        <div className="w-48 h-48 mb-4 flex items-center justify-center">
          <img 
            src="https://i.imgur.com/TmfqRTD.gif" 
            alt="Logo Tryla" 
            className="w-full h-auto"
          />
        </div>
        
        <h1 className="text-3xl font-bold text-[#e36322]">Tryla</h1>
        
        <p className="text-gray-600 mb-6">
          Bem-vindo à sua jornada de autoconhecimento e desenvolvimento pessoal
        </p>
        
        <Button 
          onClick={handleStart}
          className="bg-[#e36322] hover:bg-amber-600 text-white px-8 py-2 rounded-full text-lg"
        >
          Começar
        </Button>
      </div>
    </div>
  );
};

export default SplashScreen;