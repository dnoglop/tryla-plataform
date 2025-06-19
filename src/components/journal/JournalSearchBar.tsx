
import React from 'react';
import { Search, ListFilter, BookIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Module } from '@/services/moduleService';

type JournalSearchBarProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  modules: Module[];
  moduleFilter: number | null;
  onModuleFilterChange: (moduleId: number | null) => void;
  clearModuleFilter: () => void;
};

const JournalSearchBar: React.FC<JournalSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  modules,
  moduleFilter,
  onModuleFilterChange,
  clearModuleFilter
}) => {
  return (
    <div className="mb-4 flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar anotações..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <ListFilter className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem 
              className={!moduleFilter ? "bg-accent" : ""} 
              onClick={clearModuleFilter}
            >
              <BookIcon className="mr-2 h-4 w-4" />
              <span>Todos os módulos</span>
            </DropdownMenuItem>
            {modules.map((module: Module) => (
              <DropdownMenuItem 
                key={module.id}
                className={moduleFilter === module.id ? "bg-accent" : ""}
                onClick={() => onModuleFilterChange(module.id)}
              >
                <span className="mr-2">{module.emoji || '📚'}</span>
                <span>{module.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default JournalSearchBar;
