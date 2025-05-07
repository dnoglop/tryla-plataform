
import { Trophy, Award, Heart, MessageSquare, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import ProgressBar from "./ProgressBar";
import { useIsMobile } from "@/hooks/use-mobile";

interface ModuleCardProps {
  id: number;
  title: string;
  type: "autoconhecimento" | "empatia" | "growth" | "comunicacao" | "futuro";
  progress: number;
  completed: boolean;
  locked?: boolean;
  description?: string;
  emoji?: string;
}

const ModuleCard = ({
  id,
  title,
  type,
  progress,
  completed,
  locked = false,
  description,
  emoji,
}: ModuleCardProps) => {
  const isMobile = useIsMobile();
  
  // Configuração baseada no tipo de módulo
  const moduleConfig: Record<
    string,
    { bgColor: string; icon: React.ElementType; description: string }
  > = {
    autoconhecimento: {
      bgColor: "bg-amber-50 border-amber-200",
      icon: Trophy,
      description: description || "Descubra seus superpoderes!",
    },
    empatia: {
      bgColor: "bg-red-50 border-red-200",
      icon: Heart,
      description: description || "Conecte-se com outras pessoas!",
    },
    growth: {
      bgColor: "bg-green-50 border-green-200",
      icon: Brain,
      description: description || "Potencialize seu cérebro!",
    },
    comunicacao: {
      bgColor: "bg-blue-50 border-blue-200",
      icon: MessageSquare,
      description: description || "Domine a arte de se expressar!",
    },
    futuro: {
      bgColor: "bg-purple-50 border-purple-200",
      icon: Award,
      description: description || "Em breve...",
    },
  };

  const config = moduleConfig[type];
  const Icon = config.icon;

  // Use emoji from the admin or default to the icon
  const moduleEmoji = emoji || null;

  return (
    <Link
      to={locked ? "#" : `/modulo/${id}`}
      className={`relative overflow-hidden rounded-2xl shadow ${config.bgColor} ${
        locked
          ? "opacity-80 grayscale cursor-not-allowed"
          : "cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-1"
      }`}
    >
      <div className="w-full p-3 sm:p-4">
        {/* Completed badge */}
        {completed && (
          <div className="absolute top-1 w-full text-center">
            <span className="text-[10px] sm:text-xs font-bold text-green-600 bg-green-100 rounded-full px-2 py-0.5">
              CONCLUÍDO
            </span>
          </div>
        )}
        
        {locked && (
          <div className="absolute top-1 right-2">
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
              BLOQUEADO
            </span>
          </div>
        )}

        {/* Module header - restructured for mobile */}
        <div className="flex flex-col mt-4">
          <h3 className="font-bold text-sm sm:text-base text-gray-800 text-center">{title}</h3>
          
          <div className={`mx-auto mt-2 rounded-full p-2 ${completed ? 'bg-trilha-orange' : 'bg-white'}`}>
            {moduleEmoji ? (
              <span className="text-xl sm:text-2xl">{moduleEmoji}</span>
            ) : (
              <Icon className={`h-6 w-6 ${completed ? 'text-white' : 'text-trilha-orange'}`} />
            )}
          </div>
          
          {/* Only show description on larger screens or if very short */}
          {(!isMobile || description?.length < 30) && (
            <p className="text-[10px] sm:text-xs text-gray-600 text-center mt-1 px-1">
              {config.description}
            </p>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          {!locked ? (
            <ProgressBar 
              progress={progress} 
              className={progress === 100 ? 'bg-gray-200' : 'bg-gray-200'} 
              showIcon={false}
              compact={isMobile}
            />
          ) : (
            <div className="h-2 bg-gray-200 rounded-full"></div>
          )}
          
          <div className="mt-1 flex justify-between items-center">
            <span className="text-[10px] sm:text-xs text-gray-500">
              {progress}% completo
            </span>
            
            {!locked && !completed && progress > 0 && (
              <span className="text-[10px] sm:text-xs font-medium text-trilha-orange">CONTINUAR</span>
            )}
            {!locked && !completed && progress === 0 && (
              <span className="text-[10px] sm:text-xs font-medium text-trilha-orange">INICIAR</span>
            )}
            {completed && (
              <span className="text-[10px] sm:text-xs font-medium text-green-600">REVISAR</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ModuleCard;
