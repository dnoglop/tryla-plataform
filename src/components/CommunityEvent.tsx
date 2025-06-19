
import { Calendar } from "lucide-react";

interface CommunityEventProps {
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  onClick?: () => void;
}

const CommunityEvent = ({ title, date, time, description, location, onClick }: CommunityEventProps) => {
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  
  return (
    <div onClick={onClick} className="bg-card p-4 rounded-xl shadow-sm border hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-bold text-card-foreground">{title}</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      
      <div className="flex flex-wrap justify-between text-xs text-muted-foreground border-t border-border pt-3">
        <div>
          <span className="font-medium">Data:</span> {formattedDate} {time && `às ${time}`}
        </div>
        <div>
          <span className="font-medium">Local:</span> {location}
        </div>
      </div>
    </div>
  );
};

export default CommunityEvent;
