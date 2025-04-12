
import React from 'react';

export interface BadgeItemProps {
  title?: string;
  name?: string;
  description: string;
  isUnlocked?: boolean;
  earned?: boolean;
  icon?: string;
  id?: number;
}

const BadgeItem: React.FC<BadgeItemProps> = ({ 
  title, 
  name, 
  description, 
  isUnlocked, 
  earned, 
  icon 
}) => {
  // Use either isUnlocked or earned property (for compatibility)
  const unlocked = isUnlocked !== undefined ? isUnlocked : earned !== undefined ? earned : false;
  // Use either name or title property (for compatibility)
  const displayName = name || title || "";
  
  return (
    <div className={`rounded-lg p-3 text-center ${unlocked ? 'bg-white shadow' : 'bg-gray-100'}`}>
      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
        unlocked ? 'bg-trilha-orange text-white' : 'bg-gray-200 text-gray-400'
      }`}>
        {/* Badge icon or emoji */}
        <span className="text-lg">{icon || '🏆'}</span>
      </div>
      <h4 className={`text-sm font-medium ${unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
        {displayName}
      </h4>
      <p className="text-xs mt-1 text-gray-500">
        {description}
      </p>
      {!unlocked && (
        <span className="inline-block mt-2 text-xs bg-gray-200 px-2 py-1 rounded">
          Bloqueado
        </span>
      )}
    </div>
  );
};

export default BadgeItem;
