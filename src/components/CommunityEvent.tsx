
import { Calendar } from "lucide-react";

interface CommunityEventProps {
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  onClick?: () => void;
}

const CommunityEvent = ({
  title,
  date,
  time,
  description,
  location,
  onClick,
}: CommunityEventProps) => {
  // Formatar a data para exibição em pt-BR
  const formattedDate = new Date(date).toLocaleDateString('pt-BR');
  
  return (
    <div onClick={onClick} className="card-trilha p-4 cursor-pointer hover:border-trilha-orange">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-5 w-5 text-trilha-orange" />
        <h3 className="font-bold">{title}</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      
      <div className="flex flex-wrap justify-between text-xs text-gray-500">
        <div>
          <span className="font-medium">Data:</span> {formattedDate} às {time}
        </div>
        <div>
          <span className="font-medium">Local:</span> {location}
        </div>
      </div>
    </div>
  );
};

export default CommunityEvent;
