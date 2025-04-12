
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createPhase, updatePhase, PhaseType, IconType } from "@/services/moduleService";
import RichTextEditor from "./RichTextEditor";

interface PhaseFormProps {
  moduleId: number;
  phase?: {
    id: number;
    name: string;
    description?: string;
    type?: string;
    icon_type?: string;
    content?: string;
    video_url?: string;
    video_notes?: string;
    duration?: number;
    order_index: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PhaseForm = ({ moduleId, phase, onSuccess, onCancel }: PhaseFormProps) => {
  const isEditing = !!phase;
  const [content, setContent] = useState(phase?.content || "");
  const [phaseType, setPhaseType] = useState<PhaseType>(
    (phase?.type as PhaseType) || "text"
  );
  const [iconType, setIconType] = useState<IconType>(
    (phase?.icon_type as IconType) || "challenge"
  );

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: phase?.name || "",
      description: phase?.description || "",
      type: phase?.type || "text",
      icon_type: phase?.icon_type || "challenge",
      video_url: phase?.video_url || "",
      video_notes: phase?.video_notes || "",
      duration: phase?.duration || 15,
      order_index: phase?.order_index || 0
    }
  });

  useEffect(() => {
    if (phase) {
      setValue("name", phase.name || "");
      setValue("description", phase.description || "");
      setValue("type", phase.type || "text");
      setValue("icon_type", phase.icon_type || "challenge");
      setValue("video_url", phase.video_url || "");
      setValue("video_notes", phase.video_notes || "");
      setValue("duration", phase.duration || 15);
      setValue("order_index", phase.order_index || 0);
      setContent(phase.content || "");
      setPhaseType((phase.type as PhaseType) || "text");
      setIconType((phase.icon_type as IconType) || "challenge");
    }
  }, [phase, setValue]);

  const onSubmit = async (data: any) => {
    try {
      const phaseData = {
        module_id: moduleId,
        name: data.name,
        description: data.description,
        type: phaseType,
        icon_type: iconType,
        content,
        video_url: data.video_url,
        video_notes: data.video_notes,
        duration: Number(data.duration),
        order_index: Number(data.order_index),
      };

      if (isEditing && phase) {
        await updatePhase(phase.id, phaseData);
        toast.success("Fase atualizada com sucesso!");
      } else {
        await createPhase(phaseData as any);
        toast.success("Fase criada com sucesso!");
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving phase:", error);
      toast.error("Erro ao salvar a fase. Tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome da fase *</Label>
          <Input
            id="name"
            placeholder="Digite o nome da fase"
            {...register("name", { required: "Nome é obrigatório" })}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>}
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            placeholder="Breve descrição sobre a fase"
            {...register("description")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Tipo de fase *</Label>
            <Select 
              value={phaseType} 
              onValueChange={(value: PhaseType) => {
                setPhaseType(value);
                setValue("type", value);
              }}
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
              onValueChange={(value: IconType) => {
                setIconType(value);
                setValue("icon_type", value);
              }}
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
              {...register("duration", { 
                valueAsNumber: true,
                min: { value: 1, message: "Duração mínima de 1 minuto" },
              })}
            />
            {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration.message as string}</p>}
          </div>

          <div>
            <Label htmlFor="order_index">Ordem</Label>
            <Input
              id="order_index"
              type="number"
              placeholder="0"
              {...register("order_index", { 
                valueAsNumber: true,
                min: { value: 0, message: "Ordem mínima de 0" },
              })}
            />
            {errors.order_index && <p className="text-red-500 text-sm mt-1">{errors.order_index.message as string}</p>}
          </div>
        </div>

        {phaseType === "text" && (
          <div>
            <Label htmlFor="content">Conteúdo</Label>
            <div className="mt-1">
              <RichTextEditor value={content} onChange={setContent} />
            </div>
          </div>
        )}

        {phaseType === "video" && (
          <>
            <div>
              <Label htmlFor="video_url">URL do Vídeo (YouTube)</Label>
              <Input
                id="video_url"
                placeholder="https://www.youtube.com/watch?v=..."
                {...register("video_url")}
              />
              <p className="text-gray-500 text-xs mt-1">Coloque o link completo do YouTube</p>
            </div>

            <div>
              <Label htmlFor="video_notes">Anotações sobre o vídeo</Label>
              <Textarea
                id="video_notes"
                placeholder="Observações sobre o vídeo"
                {...register("video_notes")}
                rows={4}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
        </Button>
      </div>
    </form>
  );
};

export default PhaseForm;
