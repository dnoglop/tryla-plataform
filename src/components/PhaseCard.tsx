
import { Play, CheckCircle2, Lock, Video, FileText, HelpCircle, Star } from "lucide-react";

interface PhaseCardProps {
  id: number;
  name: string;
  description?: string;
  type: string;
  duration?: number;
  isCompleted: boolean;
  isLocked: boolean;
  onClick: () => void;
}

const PhaseCard = ({ name, description, type, duration, isCompleted, isLocked, onClick }: PhaseCardProps) => {
  const getIcon = () => {
    if (isLocked) return <Lock className="h-5 w-5 text-muted-foreground" />;
    if (isCompleted) return <CheckCircle2 className="h-5 w-5 text-primary" />;

    const iconClass = "h-5 w-5 text-primary";
    switch (type) {
      case "video":
        return <Video className={iconClass} />;
      case "text":
        return <FileText className={iconClass} />;
      case "quiz":
        return <HelpCircle className={iconClass} />;
      case "challenge":
        return <Star className={iconClass} />;
      default:
        return <Play className={iconClass} />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "video": return "Vídeo";
      case "text": return "Leitura";
      case "quiz": return "Quiz";
      case "challenge": return "Desafio";
      default: return "Conteúdo";
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className="w-full flex items-center gap-4 bg-card p-4 rounded-xl shadow-sm border hover:bg-muted/50 transition-colors disabled:bg-muted disabled:cursor-not-allowed group"
    >
      <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full transition-colors ${
        isLocked ? "bg-muted" : isCompleted ? "bg-primary/10" : "bg-primary/10"
      }`}>
        {getIcon()}
      </div>
      
      <div className={`flex-1 text-left transition-opacity ${isLocked ? "opacity-50" : ""}`}>
        <p className="font-semibold text-card-foreground">{name}</p>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {duration || 5} min • {getTypeLabel()}
        </p>
      </div>
    </button>
  );
};

export default PhaseCard;
