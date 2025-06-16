// ARQUIVO: components/forms/QuizForm.tsx (VERSÃO CORRIGIDA E COMPLETA)

import React, { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// CORREÇÃO: Removido 'createQuiz' do import. Mantido 'updateQuiz'.
import { updateQuiz, type Quiz } from "@/services/quizService"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Propriedades que o formulário recebe
interface QuizFormProps {
  quiz: Quiz; // Alterado para ser obrigatório, este formulário é sempre para edição
  onSuccess: () => void;
}

// Tipos dos valores do formulário
type FormValues = {
  name: string;
  description: string;
};

export default function QuizForm({ quiz, onSuccess }: QuizFormProps) {
  const queryClient = useQueryClient();
  const isEditing = true; // Sempre em modo de edição

  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
    },
  });
  
  // Efeito para preencher o formulário quando o quiz para edição é recebido
  useEffect(() => {
    if (quiz) {
        reset({
            name: quiz.name || "",
            description: quiz.description || "",
        });
    }
  }, [quiz, reset]);

  const mutation = useMutation({
    // CORREÇÃO: A lógica da mutação agora só lida com a atualização.
    mutationFn: (data: FormValues) => {
      // Para editar, passamos o ID da fase e os novos dados.
      // O 'quiz' vem das props e é garantido que existe.
      return updateQuiz(quiz.phase_id, data);
    },
    onSuccess: () => {
      // Invalida a query de quizzes para atualizar a lista.
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast.success("Quiz atualizado com sucesso!");
      onSuccess(); // Fecha o modal
    },
    onError: (error: Error) => toast.error(`Erro ao atualizar o quiz: ${error.message}`),
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">Nome do Quiz *</Label>
        <Input
          id="name"
          placeholder="Ex: Quiz de Empatia"
          {...register("name", { required: "O nome do quiz é obrigatório." })}
        />
        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Uma breve descrição sobre o objetivo deste quiz."
          {...register("description")}
        />
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Atualizar Quiz"}
        </Button>
      </div>
    </form>
  );
}