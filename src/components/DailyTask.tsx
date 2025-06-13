
import { CheckCircle2, Circle } from "lucide-react";

interface DailyTaskProps {
  task: string;
  completed: boolean;
  xp: number;
  onClick: () => void;
}

const DailyTask = ({ task, completed, xp, onClick }: DailyTaskProps) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-card p-4 rounded-xl shadow-sm border cursor-pointer transition-all hover:bg-muted/50 ${completed ? 'ring-2 ring-primary/20' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 ${completed ? 'text-primary' : 'text-muted-foreground'}`}>
          {completed ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <Circle className="h-6 w-6" />
          )}
        </div>
        
        <div className="flex-1">
          <p className={`font-medium ${completed ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>
            {task}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-primary">+{xp}</span>
          <span className="text-xs text-muted-foreground">XP</span>
        </div>
      </div>
    </div>
  );
};

export default DailyTask;
