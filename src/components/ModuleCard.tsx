
import { Link } from "react-router-dom";
import { Clock, Play, CheckCircle2, Lock } from "lucide-react";

interface ModuleCardProps {
  id: number;
  name: string;
  description: string;
  emoji?: string;
  type?: string;
  estimatedTime?: string;
  progress: number;
  locked?: boolean;
  completed?: boolean;
}

const ModuleCard = ({ 
  id, 
  name, 
  description, 
  emoji,
  type,
  estimatedTime, 
  progress, 
  locked = false,
  completed = false
}: ModuleCardProps) => {
  const CardContent = () => (
    <div className={`bg-card p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border transition-all hover:shadow-md ${!locked ? 'hover:scale-[1.02] hover:border-primary cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center rounded-xl sm:rounded-2xl bg-primary/10 text-2xl sm:text-3xl">
          {locked ? <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" /> : emoji || "📚"}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-card-foreground text-base sm:text-lg line-clamp-2">{name}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
        </div>
        
        <div className="flex-shrink-0">
          {completed ? (
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          ) : locked ? (
            <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
          ) : (
            <Play className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium text-card-foreground">{Math.round(progress)}%</span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {estimatedTime && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{estimatedTime}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (locked) {
    return <CardContent />;
  }

  return (
    <Link to={`/modulo/${id}`}>
      <CardContent />
    </Link>
  );
};

export default ModuleCard;
