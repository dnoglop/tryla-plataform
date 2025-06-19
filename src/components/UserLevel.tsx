
import { Trophy, Star, Zap } from "lucide-react";

interface UserLevelProps {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  totalXp?: number;
  showDetails?: boolean;
}

const UserLevel = ({ level, currentXp, nextLevelXp, totalXp, showDetails = false }: UserLevelProps) => {
  const progress = (currentXp / nextLevelXp) * 100;
  const xpToNext = nextLevelXp - currentXp;

  const getLevelIcon = () => {
    if (level >= 50) return <Trophy className="h-5 w-5 text-amber-500" />;
    if (level >= 25) return <Star className="h-5 w-5 text-primary" />;
    return <Zap className="h-5 w-5 text-primary" />;
  };

  const getLevelTitle = () => {
    if (level >= 50) return "Mestre";
    if (level >= 25) return "Especialista";
    if (level >= 10) return "Avançado";
    if (level >= 5) return "Intermediário";
    return "Iniciante";
  };

  return (
    <div className="bg-card p-4 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getLevelIcon()}
          <span className="font-bold text-card-foreground">
            Nível {level}
          </span>
          <span className="text-sm text-muted-foreground">
            • {getLevelTitle()}
          </span>
        </div>
        
        {showDetails && totalXp && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total XP</p>
            <p className="font-semibold text-card-foreground">{totalXp.toLocaleString()}</p>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            {currentXp} / {nextLevelXp} XP
          </span>
          <span className="text-primary font-medium">
            {xpToNext} para próximo nível
          </span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default UserLevel;
