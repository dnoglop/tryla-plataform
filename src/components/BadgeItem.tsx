
import React from 'react';

export interface BadgeItemProps {
  title?: string;
  name?: string;
  description: string;
  isUnlocked?: boolean;
  unlocked?: boolean;  // Added for compatibility with both naming conventions
  earned?: boolean;
  icon?: string;
  id?: number;
  xpReward?: number;
  type?: string;
}

const BadgeItem: React.FC<BadgeItemProps> = ({ 
  title, 
  name, 
  description, 
  isUnlocked, 
  unlocked,
  earned, 
  icon,
  xpReward,
  type
}) => {
  // Use either isUnlocked, unlocked or earned property (for compatibility)
  const isItemUnlocked = isUnlocked !== undefined ? isUnlocked : 
                         unlocked !== undefined ? unlocked :
                         earned !== undefined ? earned : false;
  
  // Use either name or title property (for compatibility)
  const displayName = name || title || "";
  
  return (
    <div className={`rounded-lg p-3 text-center ${isItemUnlocked ? 'bg-white shadow' : 'bg-gray-100'}`}>
      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
        isItemUnlocked ? 'bg-trilha-orange text-white' : 'bg-gray-200 text-gray-400'
      }`}>
        {/* Badge icon or emoji */}
        <span className="text-lg">{icon || '🏆'}</span>
      </div>
      <h4 className={`text-sm font-medium ${isItemUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
        {displayName}
      </h4>
      <p className="text-xs mt-1 text-gray-500">
        {description}
      </p>
      {xpReward && isItemUnlocked && (
        <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          +{xpReward} XP
        </span>
      )}
      {!isItemUnlocked && (
        <span className="inline-block mt-2 text-xs bg-gray-200 px-2 py-1 rounded">
          Bloqueado
        </span>
      )}
    </div>
  );
};

export default BadgeItem;
