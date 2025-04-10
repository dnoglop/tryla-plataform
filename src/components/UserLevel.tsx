
interface UserLevelProps {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  showLevel?: boolean;
}

const UserLevel = ({ 
  level, 
  currentXP, 
  nextLevelXP,
  showLevel = true 
}: UserLevelProps) => {
  const progress = Math.round((currentXP / nextLevelXP) * 100);
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {showLevel && (
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">Nível {level}</span>
            <span className="text-xs text-gray-500">Explorador</span>
          </div>
        )}
        <div className="text-xs text-gray-500">{currentXP}/{nextLevelXP} XP</div>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-value"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default UserLevel;
