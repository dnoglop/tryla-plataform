
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
  
  // Função para determinar a cor com base no tipo ou padrão
  const getBadgeColor = () => {
    if (!isItemUnlocked) return 'bg-gray-200 text-gray-400';
    
    switch (type) {
      case 'achievement':
        return 'bg-[#9b87f5] text-white';
      case 'badge':
        return 'bg-[#7E69AB] text-white';
      default:
        return 'bg-trilha-orange text-white';
    }
  };
  
  return (
    <div className={`relative rounded-lg p-3 text-center ${isItemUnlocked ? 'bg-white shadow-md' : 'bg-gray-100'}`}>
      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${getBadgeColor()}`}>
        <span className="text-xl">{icon || '🏆'}</span>
      </div>
      <h4 className={`text-sm font-medium ${isItemUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
        {displayName}
      </h4>
      <p className="text-xs mt-1 text-gray-500">
        {description}
      </p>
      {xpReward && isItemUnlocked && (
        <span className="inline-block mt-2 text-xs bg-[#6E59A5]/20 text-[#6E59A5] px-2 py-1 rounded-full">
          +{xpReward} XP
        </span>
      )}
      {!isItemUnlocked && (
        <span className="inline-block mt-2 text-xs bg-gray-200 px-2 py-1 rounded-full">
          Bloqueado
        </span>
      )}
      
      {isItemUnlocked && type === 'achievement' && (
        <div className="absolute top-0 right-0 w-6 h-6 bg-[#9b87f5] rounded-full -mt-2 -mr-2 flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </div>
  );
};

export default BadgeItem;
