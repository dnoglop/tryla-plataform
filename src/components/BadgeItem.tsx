
import { Badge } from "@/components/ui/badge";

interface BadgeItemProps {
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

const BadgeItem = ({ name, description, icon, earned, earnedAt }: BadgeItemProps) => {
  return (
    <div className={`bg-card p-4 rounded-xl shadow-sm border transition-all ${earned ? 'ring-2 ring-primary/20' : 'opacity-60'}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`text-2xl p-2 rounded-lg ${earned ? 'bg-primary/10' : 'bg-muted'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-card-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {earned && (
          <Badge variant="default" className="bg-primary text-primary-foreground">
            Conquistado
          </Badge>
        )}
      </div>
      
      {earned && earnedAt && (
        <p className="text-xs text-muted-foreground border-t border-border pt-2">
          Conquistado em {new Date(earnedAt).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  );
};

export default BadgeItem;
