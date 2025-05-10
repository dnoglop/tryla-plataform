
import { Lock, Check, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface PhaseCardProps {
  moduleId: number;
  phaseId: number;
  title: string;
  description: string;
  duration: number;
  status: "locked" | "available" | "inProgress" | "completed";
  iconType: "video" | "quiz" | "challenge" | "game";
}

const PhaseCard = ({
  moduleId,
  phaseId,
  title,
  description,
  duration,
  status,
  iconType,
}: PhaseCardProps) => {
  const getStatusInfo = () => {
    switch (status) {
      case "locked":
        return {
          icon: <Lock className="h-5 w-5" />,
          text: "Bloqueado",
          bgColor: "bg-gray-100",
          textColor: "text-gray-400",
          linkEnabled: false,
        };
      case "available":
        return {
          icon: <span className="text-sm font-bold">🔥</span>,
          text: "Disponível",
          bgColor: "bg-white",
          textColor: "text-gray-600",
          linkEnabled: true,
        };
      case "inProgress":
        return {
          icon: <Clock className="h-5 w-5 text-yellow-500" />,
          text: "Em progresso",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-700",
          linkEnabled: true,
        };
      case "completed":
        return {
          icon: <Check className="h-5 w-5 text-green-500" />,
          text: "Concluído",
          bgColor: "bg-green-50",
          textColor: "text-green-700",
          linkEnabled: true,
        };
      default:
        return {
          icon: null,
          text: "",
          bgColor: "bg-white",
          textColor: "text-gray-600",
          linkEnabled: true,
        };
    }
  };

  const getIconByType = () => {
    switch (iconType) {
      case "video":
        return "📹";
      case "quiz":
        return "🧠";
      case "challenge":
        return "🚀";
      case "game":
        return "🎮";
      default:
        return "📝";
    }
  };

  const statusInfo = getStatusInfo();
  const phaseIcon = getIconByType();

  const card = (
    <div className={`card-fase ${statusInfo.bgColor}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-trilha-orange bg-opacity-10 text-xl">
          {phaseIcon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">{duration} min</span>
        </div>
        <div className={`flex items-center gap-1 ${statusInfo.textColor}`}>
          {statusInfo.icon}
          <span className="text-xs font-medium">{statusInfo.text}</span>
        </div>
      </div>
    </div>
  );

  if (!statusInfo.linkEnabled) {
    return card;
  }

  return (
    <Link to={`/fase/${moduleId}/${phaseId}`} className="block">
      {card}
    </Link>
  );
};

export default PhaseCard;
