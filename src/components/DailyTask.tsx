
import { Zap } from "lucide-react";

interface DailyTaskProps {
  completed: boolean;
  xpReward: number;
  onClick: () => void;
}

const DailyTask = ({ completed, xpReward, onClick }: DailyTaskProps) => {
  return (
    <div 
      onClick={onClick} 
      className={`card-trilha flex items-center justify-between p-4 cursor-pointer ${
        completed ? "bg-gray-50" : "bg-gradient-to-r from-amber-50 to-orange-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-2 ${
          completed ? "bg-gray-200" : "bg-yellow-200"
        }`}>
          <Zap className={`h-5 w-5 ${
            completed ? "text-gray-500" : "text-yellow-600"
          }`} />
        </div>
        <div>
          <h3 className="font-medium">Missão do Dia</h3>
          <p className="text-sm text-gray-600">
            {completed 
              ? "Missão completa! Volte amanhã" 
              : "Complete uma fase para ganhar XP extra"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center rounded-full bg-trilha-orange bg-opacity-10 px-3 py-1">
        <span className={`text-sm font-bold ${
          completed ? "text-gray-500" : "text-trilha-orange"
        }`}>
          +{xpReward} XP
        </span>
      </div>
    </div>
  );
};

export default DailyTask;
