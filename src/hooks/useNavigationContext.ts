
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationContext {
  currentModule?: { id: number; name: string };
  currentPhase?: { id: number; name: string; index: number; total: number };
  previousRoute?: string;
  canGoBack: boolean;
  canGoNext: boolean;
}

export const useNavigationContext = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [context, setContext] = useState<NavigationContext>({
    canGoBack: false,
    canGoNext: false
  });

  useEffect(() => {
    // Detectar contexto baseado na rota atual
    const pathname = location.pathname;
    
    if (pathname.includes('/modulo/') && pathname.includes('/fase/')) {
      // Estamos em uma fase
      const moduleMatch = pathname.match(/\/modulo\/(\d+)/);
      const phaseMatch = pathname.match(/\/fase\/(\d+)/);
      
      if (moduleMatch && phaseMatch) {
        setContext(prev => ({
          ...prev,
          currentModule: { id: parseInt(moduleMatch[1]), name: '' },
          currentPhase: { id: parseInt(phaseMatch[1]), name: '', index: 0, total: 0 }
        }));
      }
    } else if (pathname.includes('/modulo/')) {
      // Estamos em um módulo
      const moduleMatch = pathname.match(/\/modulo\/(\d+)/);
      if (moduleMatch) {
        setContext(prev => ({
          ...prev,
          currentModule: { id: parseInt(moduleMatch[1]), name: '' },
          currentPhase: undefined
        }));
      }
    } else {
      // Outras páginas
      setContext(prev => ({
        ...prev,
        currentModule: undefined,
        currentPhase: undefined
      }));
    }
  }, [location.pathname]);

  const smartGoBack = () => {
    if (context.currentPhase) {
      // Se estamos em uma fase, voltar para o módulo
      navigate(`/modulo/${context.currentModule?.id}`);
    } else if (context.currentModule) {
      // Se estamos em um módulo, voltar para módulos
      navigate('/modulos');
    } else {
      // Comportamento padrão
      navigate(-1);
    }
  };

  const goToNextPhase = () => {
    if (context.currentPhase && context.currentModule) {
      const nextPhaseId = context.currentPhase.id + 1;
      navigate(`/modulo/${context.currentModule.id}/fase/${nextPhaseId}`);
    }
  };

  const goToPreviousPhase = () => {
    if (context.currentPhase && context.currentModule) {
      const prevPhaseId = context.currentPhase.id - 1;
      navigate(`/modulo/${context.currentModule.id}/fase/${prevPhaseId}`);
    }
  };

  return {
    context,
    smartGoBack,
    goToNextPhase,
    goToPreviousPhase,
    setContext
  };
};
