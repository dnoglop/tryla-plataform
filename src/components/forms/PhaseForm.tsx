import React, { useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPhase, updatePhase, Phase, PhaseType } from '@/services/moduleService'; // Removido 'IconType'
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from "@/components/RichTextEditor";

// 'icon_type' removido dos valores do formulário
type FormValues = {
  name: string;
  description: string;
  type: PhaseType;
  duration: number;
  order_index: number;
  content: string;
  quote: string;
  quote_author: string;
  video_url: string;
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
  
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      type: 'text',
      // 'icon_type' removido dos valores padrão
      duration: 10,
      order_index: 0,
      content: '',
      quote: '',
      quote_author: '',
      video_url: ''
    }
  });

  const selectedPhaseType = watch("type");

  // O useEffect de sincronização de ícone foi completamente removido.

  useEffect(() => {
    if (phase) {
      reset({
        name: phase.name || '',
        description: phase.description || '',
        type: phase.type as PhaseType || 'text',
        // 'icon_type' removido do reset
        duration: phase.duration || 10,
        order_index: phase.order_index || 0,
        content: phase.content || '',
        quote: phase.quote || '',
        quote_author: phase.quote_author || '',
        video_url: phase.video_url || '',
      });
    } else {
      reset(); 
    }
  }, [phase, reset]);
  
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
    onError: (error) => toast.error(`Erro ao salvar a fase. Verifique o console para detalhes.`),
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    // Cria uma cópia dos dados do formulário para manipulação segura
    const cleanData: any = { ...data };

    // 1. Converte strings vazias em `null` para todos os campos.
    // O banco de dados prefere `null` a uma string vazia ("") para campos opcionais.
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === '') {
            cleanData[key] = null;
        }
    });

    // 2. Trata o valor "vazio" específico do RichTextEditor.
    // Se o usuário não digitar nada, o Quill pode enviar '<p><br></p>'.
    if (cleanData.content === '<p><br></p>') {
        cleanData.content = null;
    }
    
    // 3. Zera campos que NUNCA devem existir para certos tipos.
    // Por exemplo, um quiz não tem conteúdo principal, frase ou vídeo.
    if (cleanData.type === 'quiz') {
        cleanData.content = null;
        cleanData.quote = null;
        cleanData.quote_author = null;
        cleanData.video_url = null;
    } 
    // Uma fase do tipo "Apenas Vídeo" não tem conteúdo de texto ou frase.
    else if (cleanData.type === 'video') {
        cleanData.content = null;
        cleanData.quote = null;
        cleanData.quote_author = null;
    }

    // Envia os dados limpos para a mutation
    mutation.mutate({ 
      isEditing: !!phase, 
      phaseData: { ...cleanData, module_id: moduleId }
    });
};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full space-y-4 p-1">
      <div>
        <Label htmlFor="name">Nome da Fase *</Label>
        <Input id="name" {...register("name", { required: "Nome é obrigatório" })} className={errors.name ? 'border-destructive' : ''} />
        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="description">Descrição (Apoio interno)</Label>
        <Textarea id="description" {...register("description")} />
      </div>

      {/* A DIV do 'icon_type' foi completamente removida daqui. */}
      <div>
        <Label htmlFor="type">Tipo de Fase</Label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Selecione um tipo..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="texto">Conteúdo de Texto</SelectItem>
                <SelectItem value="desafio">Desafio</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
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
      
      {(selectedPhaseType === 'text' || selectedPhaseType === 'challenge') && (
        <div className="space-y-6 pt-4 border-t">
          <div>
            <Label htmlFor="content">Conteúdo Principal</Label>
            <div className="mt-1 border rounded-md">
                <RichTextEditor
                    value={watch('content') || ''}
                    onChange={(content) => setValue('content', content)}
                />
            </div>
          </div>
          <div className="p-4 border rounded-md space-y-3 bg-muted/40">
              <h4 className="font-semibold text-sm text-muted-foreground">Frase de Destaque (Opcional)</h4>
              <div>
                  <Label htmlFor="quote">Frase</Label>
                  <Textarea 
                    id="quote" 
                    placeholder="Ex: A única forma de fazer um grande trabalho é amar o que você faz." 
                    {...register("quote")} 
                  />
              </div>
              <div>
                  <Label htmlFor="quote_author">Autor da Frase</Label>
                  <Input 
                    id="quote_author" 
                    placeholder="Ex: Steve Jobs" 
                    {...register("quote_author")} 
                  />
              </div>
          </div>
          <div>
            <Label htmlFor="video_url">Link do Vídeo Incorporado (Opcional)</Label>
            <Input 
                id="video_url" 
                placeholder="https://www.youtube.com/watch?v=..." 
                {...register("video_url")} 
            />
          </div>
        </div>
      )}

      {selectedPhaseType === 'video' && (
         <div>
          <Label htmlFor="video_url">URL do Vídeo (Obrigatório para este tipo)</Label>
          <Input id="video_url" placeholder="https://www.youtube.com/watch?v=..." {...register("video_url")} />
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-4 mt-auto border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Fase' : 'Criar Fase'}
        </Button>
      </div>
    </form>
  );
}