
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhaseType, IconType } from "@/services/moduleService";

interface FormHeaderProps {
  name: string;
  description: string;
  phaseType: PhaseType;
  iconType: IconType;
  duration: number;
  orderIndex: number;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onPhaseTypeChange: (value: PhaseType) => void;
  onIconTypeChange: (value: IconType) => void;
  onDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOrderIndexChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: {
    name?: { message?: string };
    duration?: { message?: string };
    order_index?: { message?: string };
  };
}

const FormHeader = ({
  name,
  description,
  phaseType,
  iconType,
  duration,
  orderIndex,
  onNameChange,
  onDescriptionChange,
  onPhaseTypeChange,
  onIconTypeChange,
  onDurationChange,
  onOrderIndexChange,
  errors
}: FormHeaderProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nome da fase *</Label>
        <Input
          id="name"
          placeholder="Digite o nome da fase"
          value={name}
          onChange={onNameChange}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Breve descrição sobre a fase"
          value={description}
          onChange={onDescriptionChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Tipo de fase *</Label>
          <Select 
            value={phaseType} 
            onValueChange={onPhaseTypeChange}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Conteúdo de texto</SelectItem>
              <SelectItem value="video">Vídeo</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="challenge">Desafio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="icon_type">Tipo de ícone</Label>
          <Select 
            value={iconType} 
            onValueChange={onIconTypeChange}
          >
            <SelectTrigger id="icon_type">
              <SelectValue placeholder="Selecione o ícone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Vídeo</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="challenge">Desafio</SelectItem>
              <SelectItem value="game">Jogo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duration">Duração (minutos)</Label>
          <Input
            id="duration"
            type="number"
            placeholder="15"
            value={duration.toString()}
            onChange={onDurationChange}
          />
          {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>}
        </div>

        <div>
          <Label htmlFor="order_index">Ordem</Label>
          <Input
            id="order_index"
            type="number"
            placeholder="0"
            value={orderIndex.toString()}
            onChange={onOrderIndexChange}
          />
          {errors.order_index && <p className="text-red-500 text-sm mt-1">{errors.order_index.message}</p>}
        </div>
      </div>
    </div>
  );
};

export default FormHeader;
