import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createModule, updateModule, ModuleType } from "@/services/moduleService";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
// import RichTextEditor from "@/components/RichTextEditor";

interface ModuleFormProps {
  module?: {
    id: number;
    name: string;
    description?: string;
    content?: string;
    type?: string;
    emoji?: string;
    order_index: number;
  };
  onSuccess?: () => void;
}

const ModuleForm = ({ module, onSuccess }: ModuleFormProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!module;
  const [moduleType, setModuleType] = useState<ModuleType>(
    (module?.type as ModuleType) || "autoconhecimento"
  );
  const [content, setContent] = useState(module?.content || "");

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: {
      name: module?.name || "",
      description: module?.description || "",
      emoji: module?.emoji || "📚",
      order_index: module?.order_index || 0
    }
  });

  // Update form when module changes
  useEffect(() => {
    if (module) {
      reset({
        name: module.name || "",
        description: module.description || "",
        emoji: module.emoji || "📚",
        order_index: module.order_index || 0
      });
      setModuleType((module.type as ModuleType) || "autoconhecimento");
      setContent(module.content || "");
    }
  }, [module, reset]);

  const createModuleMutation = useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminModules'] });
      toast.success("Módulo criado com sucesso!");
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Error creating module:", error);
      toast.error(`Erro ao criar módulo: ${error.message}`);
    }
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateModule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminModules'] });
      toast.success("Módulo atualizado com sucesso!");
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Error updating module:", error);
      toast.error(`Erro ao atualizar módulo: ${error.message}`);
    }
  });

  const onSubmit = async (data: any) => {
    const moduleData = {
      ...data,
      type: moduleType,
      content: content
    };

    try {
      if (isEditing && module) {
        updateModuleMutation.mutate({ id: module.id, data: moduleData });
      } else {
        createModuleMutation.mutate(moduleData);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do módulo *</Label>
        <Input
          id="name"
          placeholder="Digite o nome do módulo"
          {...register("name", { required: "Nome é obrigatório" })}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message as string}</p>}
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Breve descrição sobre o módulo"
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="emoji">Emoji</Label>
          <Input
            id="emoji"
            placeholder="📚"
            {...register("emoji")}
          />
          <p className="text-muted-foreground text-xs mt-1">Um emoji representativo</p>
        </div>

        <div>
          <Label htmlFor="type">Tipo de módulo</Label>
          <Select 
            value={moduleType} 
            onValueChange={(value: ModuleType) => setModuleType(value)}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
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
          {errors.order_index && <p className="text-destructive text-sm mt-1">{errors.order_index.message as string}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="content">Conteúdo Introdutório</Label>
        <div className="mt-2 border rounded-md">
          {/* <RichTextEditor
            value={content}
            onChange={setContent}
          /> */}
           <Textarea
            id="content-textarea"
            placeholder="Este conteúdo será exibido na aba Introdução do módulo"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px]"
          />
        </div>
        <p className="text-muted-foreground text-xs mt-1">Este conteúdo será exibido na aba Introdução do módulo</p>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Módulo" : "Criar Módulo"}
        </Button>
      </div>
    </form>
  );
};

export default ModuleForm;