
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigationContext } from '@/hooks/useNavigationContext';

interface PhaseGestureNavigationProps {
  onShowMiniMap?: () => void;
  hasNextPhase?: boolean;
  hasPreviousPhase?: boolean;
}

export const PhaseGestureNavigation: React.FC<PhaseGestureNavigationProps> = ({
  onShowMiniMap,
  hasNextPhase = false,
  hasPreviousPhase = false
}) => {
  const { goToNextPhase, goToPreviousPhase } = useNavigationContext();
  const [showControls, setShowControls] = useState(false);

  // Mostrar controles temporariamente quando o usuário interage
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleActivity = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    const handleTouch = () => handleActivity();
    const handleMouse = () => handleActivity();

    window.addEventListener('touchstart', handleTouch);
    window.addEventListener('mousemove', handleMouse);

    return () => {
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('mousemove', handleMouse);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      {/* Botão de navegação anterior */}
      <div
        className={cn(
          "fixed left-4 top-1/2 -translate-y-1/2 z-40 transition-all duration-300",
          showControls ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full"
        )}
      >
        {hasPreviousPhase && (
          <Button
            onClick={goToPreviousPhase}
            size="icon"
            className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/30 border-0 shadow-lg"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </Button>
        )}
      </div>

      {/* Botão de navegação próxima */}
      <div
        className={cn(
          "fixed right-4 top-1/2 -translate-y-1/2 z-40 transition-all duration-300",
          showControls ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
        )}
      >
        {hasNextPhase && (
          <Button
            onClick={goToNextPhase}
            size="icon"
            className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/30 border-0 shadow-lg"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </Button>
        )}
      </div>

      {/* Botão do mini-mapa */}
      <div
        className={cn(
          "fixed bottom-28 right-4 z-40 transition-all duration-300",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
        )}
      >
        <Button
          onClick={onShowMiniMap}
          size="icon"
          className="h-12 w-12 rounded-full bg-primary/90 backdrop-blur-md hover:bg-primary border-0 shadow-lg"
        >
          <Map className="h-5 w-5 text-white" />
        </Button>
      </div>
    </>
  );
};
