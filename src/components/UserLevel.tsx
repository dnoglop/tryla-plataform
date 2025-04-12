
import React from 'react';

export interface UserLevelProps {
  level: number;
  xp: number;
  nextLevelXp?: number; // Make this optional with a default calculation
}

const UserLevel: React.FC<UserLevelProps> = ({ level, xp, nextLevelXp }) => {
  // Calculate progress to next level (example: 75% progress)
  const calculatedNextLevelXp = nextLevelXp || level * 100; // Use provided value or calculate
  const progress = Math.min(Math.floor((xp / calculatedNextLevelXp) * 100), 100);

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center text-xs text-gray-600">
        <span>Nível {level}</span>
        <span>{xp} XP</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
        <div 
          className="h-full bg-trilha-orange rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default UserLevel;
