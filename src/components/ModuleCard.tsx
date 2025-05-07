
import { Trophy, Award, Heart, MessageSquare, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import ProgressBar from "./ProgressBar";

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
      <div className="w-full p-4">
        {/* Module header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-col">
            <h3 className="font-bold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-600">{config.description}</p>
          </div>
          
          <div className={`rounded-full p-2 ${completed ? 'bg-trilha-orange' : 'bg-white'}`}>
            {moduleEmoji ? (
              <span className="text-xl">{moduleEmoji}</span>
            ) : (
              <Icon className={`h-5 w-5 ${completed ? 'text-white' : 'text-trilha-orange'}`} />
            )}
          </div>
        </div>
        
        {/* Status indicators */}
        {completed && (
          <span className="absolute top-2 right-2 text-xs font-bold text-green-600 bg-green-100 rounded-full px-2 py-0.5">
            CONCLUÍDO
          </span>
        )}
        {locked && (
          <span className="absolute top-2 right-2 text-xs font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
            BLOQUEADO
          </span>
        )}

        {/* Progress bar */}
        <div className="mt-4">
          {!locked ? (
            <ProgressBar 
              progress={progress} 
              className={progress === 100 ? 'bg-gray-200' : 'bg-gray-200'} 
              showIcon={true}
            />
          ) : (
            <div className="h-3 bg-gray-200 rounded-full"></div>
          )}
          
          <div className="mt-1 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {locked ? "Desbloqueie concluindo os módulos anteriores" : `${progress}% completo`}
            </span>
            
            {!locked && !completed && progress > 0 && (
              <span className="text-xs font-medium text-trilha-orange">CONTINUAR</span>
            )}
            {!locked && !completed && progress === 0 && (
              <span className="text-xs font-medium text-trilha-orange">INICIAR</span>
            )}
            {completed && (
              <span className="text-xs font-medium text-green-600">REVISAR</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ModuleCard;
