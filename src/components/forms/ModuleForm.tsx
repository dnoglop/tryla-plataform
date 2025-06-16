import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createModule, updateModule, Module, ModuleType } from "@/services/moduleService"; // Garanta que a interface Module aqui inclua os novos campos
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Definição dos valores do formulário para tipagem forte
type FormValues = {
  name: string;
  description: string;
  emoji: string;
  order_index: number;
  level: string;
  objective: string;
  entry_trigger: string;
  tags: string; // Usaremos string para o input, e converteremos para array no envio
  pre_requisites: string; // Mesmo para pré-requisitos
  problem_statements: string;
  success_outcomes: string;
};

interface ModuleFormProps {
  module?: Module; // A interface Module deve ser atualizada no moduleService.ts
  onSuccess?: () => void;
}

const ModuleForm = ({ module, onSuccess }: ModuleFormProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!module;
  
  const [moduleType, setModuleType] = useState<ModuleType>(
    (module?.type as ModuleType) || "autoconhecimento"
  );

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      emoji: '📚',
      order_index: 0,
      level: 'Básico',
      objective: '',
      entry_trigger: '',
      tags: '',
      pre_requisites: '',
      problem_statements: '',
      success_outcomes: ''
    }
  });

  useEffect(() => {
    if (module) {
      reset({
        name: module.name || "",
        description: module.description || "",
        emoji: module.emoji || "📚",
        order_index: module.order_index || 0,
        level: module.level || 'Básico',
        objective: module.objective || '',
        entry_trigger: module.entry_trigger || '',
        // Converte arrays para string para popular o formulário
        tags: (module.tags || []).join(', '),
        pre_requisites: (module.pre_requisites || []).join(', '),
        problem_statements: (module.problem_statements || []).join(', \n'),
        success_outcomes: (module.success_outcomes || []).join(', \n'),
      });
      setModuleType((module.type as ModuleType) || "autoconhecimento");
    }
  }, [module, reset]);

  const mutation = useMutation({
    mutationFn: ({ isEditing, data, id }: { isEditing: boolean, data: Partial<Module>, id?: number }) => {
      if (isEditing && id) {
        return updateModule(id, data);
      }
      return createModule(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminModules'] });
      toast.success(`Módulo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      if (onSuccess) onSuccess();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const onSubmit = async (data: FormValues) => {
    // Processa os dados do formulário para o formato do banco de dados
    const moduleData: Partial<Module> = {
      ...data,
      type: moduleType,
      // Converte strings separadas por vírgula em arrays de texto limpos
      tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      // Converte IDs em array de números
      pre_requisites: data.pre_requisites.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)),
      // Converte textos separados por nova linha/vírgula em arrays
      problem_statements: data.problem_statements.split(/,|\n/).map(s => s.trim()).filter(Boolean),
      success_outcomes: data.success_outcomes.split(/,|\n/).map(s => s.trim()).filter(Boolean),
    };

    mutation.mutate({ isEditing, data: moduleData, id: module?.id });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">Nome do módulo *</Label>
        <Input id="name" {...register("name", { required: "Nome é obrigatório" })} />
        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message as string}</p>}
      </div>

      <div>
        <Label htmlFor="description">Descrição (Visão geral do módulo)</Label>
        <Textarea id="description" {...register("description")} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="emoji">Emoji</Label>
          <Input id="emoji" {...register("emoji")} />
        </div>
        <div>
          <Label htmlFor="type">Categoria</Label>
          <Select value={moduleType} onValueChange={(value: ModuleType) => setModuleType(value)}>
            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="autoconhecimento">Autoconhecimento</SelectItem>
              <SelectItem value="empatia">Empatia</SelectItem>
              <SelectItem value="growth">Crescimento</SelectItem>
              <SelectItem value="comunicacao">Comunicação</SelectItem>
              <SelectItem value="futuro">Futuro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
            <Label htmlFor="level">Nível</Label>
            <Controller name="level" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Básico">Básico</SelectItem>
                        <SelectItem value="Intermediário">Intermediário</SelectItem>
                        <SelectItem value="Avançado">Avançado</SelectItem>
                    </SelectContent>
                </Select>
            )} />
        </div>
        <div>
          <Label htmlFor="order_index">Ordem</Label>
          <Input id="order_index" type="number" {...register("order_index", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-lg">Metadados para a IA</h3>
        <div>
            <Label htmlFor="objective">Objetivo Principal do Módulo</Label>
            <Textarea id="objective" {...register("objective")} placeholder="O que o usuário será capaz de fazer ou entender após este módulo?"/>
        </div>
        <div>
            <Label htmlFor="entry_trigger">Gatilho de Entrada</Label>
            <Textarea id="entry_trigger" {...register("entry_trigger")} placeholder="Qual sentimento ou problema faria um usuário procurar este módulo? Ex: 'Sinto-me perdido na carreira'."/>
        </div>
        <div>
            <Label htmlFor="problem_statements">Problemas que este Módulo Resolve</Label>
            <Textarea id="problem_statements" {...register("problem_statements")} placeholder="Liste os problemas específicos. Separe por vírgula ou nova linha."/>
        </div>
        <div>
            <Label htmlFor="success_outcomes">Resultados de Sucesso Esperados</Label>
            <Textarea id="success_outcomes" {...register("success_outcomes")} placeholder="Liste os resultados concretos. Separe por vírgula ou nova linha."/>
        </div>
        <div>
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" {...register("tags")} placeholder="Ex: autoconhecimento, carreira, valores"/>
            <p className="text-muted-foreground text-xs mt-1">Separe as tags por vírgula.</p>
        </div>
        <div>
            <Label htmlFor="pre_requisites">Pré-requisitos (IDs de outros módulos)</Label>
            <Input id="pre_requisites" {...register("pre_requisites")} placeholder="Ex: 1, 5, 12"/>
            <p className="text-muted-foreground text-xs mt-1">Separe os IDs dos módulos por vírgula.</p>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-6 border-t mt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Módulo" : "Criar Módulo"}
        </Button>
      </div>
    </form>
  );
};

export default ModuleForm;