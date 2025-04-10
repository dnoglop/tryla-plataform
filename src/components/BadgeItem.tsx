
import { Trophy } from "lucide-react";

interface BadgeItemProps {
  title: string;
  description: string;
  earned: boolean;
  icon?: string;
}

const BadgeItem = ({
  title,
  description,
  earned,
  icon = "🏆",
}: BadgeItemProps) => {
  return (
    <div className={`card-trilha p-4 ${earned ? "" : "opacity-60 grayscale"}`}>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-trilha-orange/10 text-3xl shadow-inner">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold">{title}</h3>
            {earned && (
              <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                <Trophy className="h-3 w-3" />
                <span>Conquistado</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default BadgeItem;
