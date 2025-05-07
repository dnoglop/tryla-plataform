
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
      bgColor: "bg-yellow-100 border-yellow-200",
      icon: Trophy,
      description: description || "Descubra seus superpoderes!",
    },
    empatia: {
      bgColor: "bg-red-100 border-red-200",
      icon: Heart,
      description: description || "Conecte-se com outras pessoas!",
    },
    growth: {
      bgColor: "bg-green-100 border-green-200",
      icon: Brain,
      description: description || "Potencialize seu cérebro!",
    },
    comunicacao: {
      bgColor: "bg-blue-100 border-blue-200",
      icon: MessageSquare,
      description: description || "Domine a arte de se expressar!",
    },
    futuro: {
      bgColor: "bg-purple-100 border-purple-200",
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
      className={`card-modulo ${config.bgColor} ${
        locked
          ? "opacity-70 cursor-not-allowed"
          : "cursor-pointer hover:shadow-md transition-transform duration-300 hover:-translate-y-1"
      }`}
    >
      <div className="w-full">
        <div className="mb-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`rounded-full bg-white p-2 ${completed ? 'animate-pulse' : ''}`}>
              {moduleEmoji ? (
                <span className="text-lg">{moduleEmoji}</span>
              ) : (
                <Icon className="h-5 w-5 text-trilha-orange" />
              )}
            </div>
            <h3 className="font-bold">{title}</h3>
          </div>
          {completed && (
            <span className="text-xs font-bold text-green-600 animate-bounce-slow">
              CONCLUÍDO
            </span>
          )}
          {locked && (
            <span className="text-xs font-bold text-gray-500">
              BLOQUEADO
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 mb-3">{config.description}</p>

        {!locked ? (
          <ProgressBar 
            progress={progress} 
            className={progress === 100 ? 'animate-pulse' : 'transition-all duration-1000 ease-out'} 
          />
        ) : (
          <div className="progress-bar bg-gray-200 h-2 rounded-full overflow-hidden">
          </div>
        )}

        <div className="mt-1 text-right">
          <span className="text-xs text-gray-600">
            {locked ? "Desbloqueie concluindo os módulos anteriores" : `${progress}% completo`}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ModuleCard;
