import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPhase, updatePhase, Phase, PhaseType, IconType } from '@/services/moduleService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FormValues = {
  name: string;
  description: string;
  type: PhaseType;
  icon_type: IconType;
  duration: number;
  order_index: number;
  content?: string;
  video_url?: string;
};

interface PhaseFormProps {
  phase?: Phase;
  moduleId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PhaseForm({ phase, moduleId, onSuccess, onCancel }: PhaseFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!phase;
  
  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      type: 'text',
      icon_type: 'text',
      duration: 10,
      order_index: 0,
      content: '',
      video_url: ''
    }
  });

  useEffect(() => {
    if (phase) {
      reset({
        name: phase.name || '',
        description: phase.description || '',
        type: phase.type as PhaseType || 'text',
        icon_type: phase.icon_type as IconType || 'text',
        duration: phase.duration || 10,
        order_index: phase.order_index || 0,
        content: phase.content || '',
        video_url: phase.video_url || '',
      });
    }
  }, [phase, reset]);
  
  const selectedPhaseType = watch("type");

  const mutation = useMutation({
    mutationFn: (data: { isEditing: boolean, phaseData: Partial<Phase> & { module_id: number } }) => {
      if (data.isEditing && phase) {
        return updatePhase(phase.id, data.phaseData);
      }
      return createPhase(data.phaseData as any);
    },
    onSuccess: () => {
      toast.success(`Fase ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['adminPhases', moduleId] });
      onSuccess();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    mutation.mutate({ 
      isEditing: !!phase, 
      phaseData: { ...data, module_id: moduleId }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full space-y-4">
      <div>
        <Label htmlFor="name">Nome da Fase *</Label>
        <Input id="name" {...register("name", { required: "Nome é obrigatório" })} className={errors.name ? 'border-destructive' : ''} />
        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register("description")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Tipo de Fase</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecione um tipo..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Conteúdo de Texto</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="challenge">Desafio</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="icon_type">Tipo de Ícone</Label>
             <Controller
              control={control}
              name="icon_type"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecione um ícone..." /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="challenge">Desafio</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
          <div>
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input id="duration" type="number" {...register("duration", { valueAsNumber: true, min: 1 })} />
          </div>
          <div>
              <Label htmlFor="order_index">Ordem</Label>
              <Input id="order_index" type="number" {...register("order_index", { valueAsNumber: true, min: 0 })} />
          </div>
      </div>
      
      {selectedPhaseType === 'text' || selectedPhaseType === 'challenge' ? (
        <div>
          <Label htmlFor="content">Conteúdo</Label>
          <Textarea id="content" {...register("content")} className="min-h-[150px]" />
        </div>
      ) : null}

      {selectedPhaseType === 'video' ? (
         <div>
          <Label htmlFor="video_url">URL do Vídeo (Link completo do YouTube)</Label>
          <Input id="video_url" placeholder="https://www.youtube.com/watch?v=..." {...register("video_url")} />
        </div>
      ) : null}
      
      <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Fase'}
        </Button>
      </div>
    </form>
  );
}