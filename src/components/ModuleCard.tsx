import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Lock, CheckCircle } from "lucide-react";

interface ModuleCardProps {
  id: number;
  title: string;
  description?: string | null;
  emoji?: string | null;
  type: string;
  progress: number;
  completed: boolean;
  locked: boolean;
}

const ModuleCard = ({ id, title, description, emoji, type, progress, completed, locked }: ModuleCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (!locked) {
      navigate(`/modulo/${id}`);
    }
  };

  const typeColors: Record<string, string> = {
    autoconhecimento: "bg-yellow-50",
    empatia: "bg-red-50",
    growth: "bg-green-50",
    comunicacao: "bg-blue-50",
    futuro: "bg-purple-50",
    default: "bg-gray-100"
  };
  const bgColor = typeColors[type] || typeColors.default;

  return (
    <div
      onClick={handleCardClick}
      className={`relative p-4 rounded-2xl shadow-md h-full flex flex-col justify-between transition-all duration-300 ${
        locked 
          ? 'bg-gray-100 cursor-not-allowed' 
          : `${bgColor} cursor-pointer hover:shadow-xl hover:-translate-y-1`
      }`}
    >
      {/* Conteúdo do Card */}
      <div className={`flex flex-col flex-grow ${locked ? 'opacity-40' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <span className="text-3xl ml-3">{emoji || "✨"}</span>
        </div>
        
        <div className="mt-auto pt-4">
          {completed ? (
             <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
               <CheckCircle size={18} />
               <span>Concluído</span>
             </div>
          ) : (
            <div>
              <Progress value={progress} className="h-1.5 bg-gray-200 [&>*]:bg-trilha-orange" />
              <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}%</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Overlay de Bloqueio */}
      {locked && (
        <div className="absolute inset-0 bg-gray-300/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
          <Lock className="text-gray-500" size={24} />
          <span className="text-sm font-semibold text-gray-600 mt-1">Bloqueado</span>
        </div>
      )}
    </div>
  );
};

export default ModuleCard;