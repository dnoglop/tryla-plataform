
import React, { useEffect, useState } from 'react';
import { getProfile } from '@/services/profileService';

export interface UserLevelProps {
  level?: number;
  xp?: number;
  nextLevelXp?: number;
  userId?: string;  // Added userId as optional prop
  className?: string;
}

const UserLevel: React.FC<UserLevelProps> = ({ 
  level: propLevel, 
  xp: propXp, 
  nextLevelXp, 
  userId,
  className = ""
}) => {
  const [level, setLevel] = useState<number>(propLevel || 1);
  const [xp, setXp] = useState<number>(propXp || 0);
  
  // If userId is provided, fetch the user's level and XP
  useEffect(() => {
    if (userId) {
      const fetchUserLevel = async () => {
        const profile = await getProfile(userId);
        if (profile) {
          setLevel(profile.level || 1);
          setXp(profile.xp || 0);
        }
      };
      
      fetchUserLevel();
    }
  }, [userId]);
  
  // Calculate progress to next level (example: 75% progress)
  const calculatedNextLevelXp = nextLevelXp || level * 100; // Use provided value or calculate
  const progress = Math.min(Math.floor((xp / calculatedNextLevelXp) * 100), 100);

  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex justify-between items-center text-xs text-gray-600">
        <span>Nível {level}</span>
        <span>{xp} XP</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
        <div 
          className="h-full bg-[#9b87f5] rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default UserLevel;
