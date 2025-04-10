
import { Trophy, Award, Heart, MessageSquare, Brain } from "lucide-react";
import { Link } from "react-router-dom";

interface ModuleCardProps {
  id: number;
  title: string;
  type: "autoconhecimento" | "empatia" | "growth" | "comunicacao" | "futuro";
  progress: number;
  completed: boolean;
  locked?: boolean;
}

const ModuleCard = ({
  id,
  title,
  type,
  progress,
  completed,
  locked = false,
}: ModuleCardProps) => {
  // Configuração baseada no tipo de módulo
  const moduleConfig: Record<
    string,
    { bgColor: string; icon: React.ElementType; description: string }
  > = {
    autoconhecimento: {
      bgColor: "bg-yellow-100 border-yellow-200",
      icon: Trophy,
      description: "Descubra seus superpoderes!",
    },
    empatia: {
      bgColor: "bg-red-100 border-red-200",
      icon: Heart,
      description: "Conecte-se com outras pessoas!",
    },
    growth: {
      bgColor: "bg-green-100 border-green-200",
      icon: Brain,
      description: "Potencialize seu cérebro!",
    },
    comunicacao: {
      bgColor: "bg-blue-100 border-blue-200",
      icon: MessageSquare,
      description: "Domine a arte de se expressar!",
    },
    futuro: {
      bgColor: "bg-purple-100 border-purple-200",
      icon: Award,
      description: "Em breve...",
    },
  };

  const config = moduleConfig[type];
  const Icon = config.icon;

  return (
    <Link
      to={locked ? "#" : `/modulo/${id}`}
      className={`card-modulo ${config.bgColor} ${
        locked
          ? "opacity-70 cursor-not-allowed"
          : "cursor-pointer"
      }`}
    >
      <div className="w-full">
        <div className="mb-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white p-2">
              <Icon className="h-5 w-5 text-trilha-orange" />
            </div>
            <h3 className="font-bold">{title}</h3>
          </div>
          {completed && (
            <span className="text-xs font-bold text-green-600">
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
          <div className="progress-bar">
            <div
              className="progress-value"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : (
          <div className="progress-bar">
            <div
              className="h-full rounded-full bg-gray-300"
              style={{ width: "100%" }}
            />
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
