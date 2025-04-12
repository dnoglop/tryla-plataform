
import React from 'react';

export interface BadgeItemProps {
  name: string;
  description: string;
  isUnlocked: boolean;
}

const BadgeItem: React.FC<BadgeItemProps> = ({ name, description, isUnlocked }) => {
  return (
    <div className={`rounded-lg p-3 text-center ${isUnlocked ? 'bg-white shadow' : 'bg-gray-100'}`}>
      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
        isUnlocked ? 'bg-trilha-orange text-white' : 'bg-gray-200 text-gray-400'
      }`}>
        {/* Badge icon or emoji */}
        <span className="text-lg">🏆</span>
      </div>
      <h4 className={`text-sm font-medium ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
        {name}
      </h4>
      <p className="text-xs mt-1 text-gray-500">
        {description}
      </p>
      {!isUnlocked && (
        <span className="inline-block mt-2 text-xs bg-gray-200 px-2 py-1 rounded">
          Bloqueado
        </span>
      )}
    </div>
  );
};

export default BadgeItem;
