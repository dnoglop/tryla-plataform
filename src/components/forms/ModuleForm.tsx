import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// Sua interface Module precisa incluir todos os campos da tabela para o TypeScript funcionar bem.
import { createModule, updateModule, Module, ModuleType } from "@/services/moduleService"; 
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Definição dos valores do formulário
type FormValues = {
  name: string;
  description: string;
  emoji: string;
  order_index: number;
  level: string;
  objective: string;
  entry_trigger: string;
  tags: string;
  pre_requisites: string;
  problem_statements: string;
  success_outcomes: string;
};

interface ModuleFormProps {
  module?: Module;
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
      name: '', description: '', emoji: '📚', order_index: 0, level: 'Básico',
      objective: '', entry_trigger: '', tags: '', pre_requisites: '',
      problem_statements: '', success_outcomes: ''
    }
  });

  useEffect(() => {
    if (isEditing && module) {
      reset({
        name: module.name || "",
        description: module.description || "",
        emoji: module.emoji || "📚",
        order_index: module.order_index || 0,
        level: module.level || 'Básico',
        objective: module.objective || '',
        entry_trigger: module.entry_trigger || '',
        tags: (module.tags || []).join(', '),
        pre_requisites: (module.pre_requisites || []).join(', '),
        problem_statements: (module.problem_statements || []).join('\n'),
        success_outcomes: (module.success_outcomes || []).join('\n'),
      });
      setModuleType((module.type as ModuleType) || "autoconhecimento");
    } else {
      // Garante que o formulário seja limpo ao mudar de edição para criação
      reset();
    }
  }, [module, isEditing, reset]);

  const mutation = useMutation({
    mutationFn: ({ isEditing, data, id }: { isEditing: boolean, data: Omit<Module, 'id' | 'created_at' | 'updated_at'>, id?: number }) => {
      if (isEditing && id) {
        // Para update, passamos apenas os campos que podem ser alterados
        return updateModule(id, data);
      }
      // Para create, a função de serviço já espera o objeto correto
      return createModule(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminModules'] });
      toast.success(`Módulo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      if (onSuccess) onSuccess();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  // ==========================================================
  // FUNÇÃO onSubmit CORRIGIDA
  // ==========================================================
  const onSubmit = (data: FormValues) => {
    // Mapeamento explícito para garantir a estrutura e tipos corretos para o Supabase
    const moduleDataForSupabase: Omit<Module, 'id' | 'created_at' | 'updated_at'> = {
      name: data.name,
      description: data.description || null,
      type: moduleType,
      emoji: data.emoji || null,
      order_index: data.order_index || 0,
      content: module?.content || null, // Preserva o conteúdo existente se estiver editando
      level: data.level || null,
      entry_trigger: data.entry_trigger || null,
      objective: data.objective || null,
      tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      pre_requisites: data.pre_requisites.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)),
      problem_statements: data.problem_statements.split(/,|\n/).map(s => s.trim()).filter(Boolean),
      success_outcomes: data.success_outcomes.split(/,|\n/).map(s => s.trim()).filter(Boolean),
      is_published: module?.is_published ?? true, // Preserva o status de publicação ou define como true
    };

    console.log("Dados a serem enviados:", moduleDataForSupabase); // Ótimo para debug

    mutation.mutate({ isEditing, data: moduleDataForSupabase, id: module?.id });
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
              <SelectItem value="comunicacao">Comunicação</SelectItem>
              <SelectItem value="carreira">Carreira</SelectItem>
              <SelectItem value="produtividade">Produtividade</SelectItem>
              <SelectItem value="habilidades">Habilidades</SelectItem>
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
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Salvando...</> : isEditing ? "Atualizar Módulo" : "Criar Módulo"}
        </Button>
      </div>
    </form>
  );
};

export default ModuleForm;