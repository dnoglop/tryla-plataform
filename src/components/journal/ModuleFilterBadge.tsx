
import React from 'react';
import { Button } from '@/components/ui/button';

type ModuleFilterBadgeProps = {
  moduleName: string | null;
  onClearFilter: () => void;
};

const ModuleFilterBadge: React.FC<ModuleFilterBadgeProps> = ({ moduleName, onClearFilter }) => {
  if (!moduleName) return null;
  
  return (
    <div className="bg-blue-50 rounded-md p-2 mb-4 flex items-center justify-between">
      <span className="text-sm text-blue-700">
        Filtrado por: {moduleName}
      </span>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClearFilter} 
        className="text-blue-700 h-6 px-2"
      >
        Limpar
      </Button>
    </div>
  );
};

export default ModuleFilterBadge;
