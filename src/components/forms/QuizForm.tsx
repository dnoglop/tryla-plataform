import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQuiz, updateQuiz, type Quiz } from "@/services/quizService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface QuizFormProps {
  quiz?: Quiz;
  onSuccess: () => void;
}

type FormValues = {
  name: string;
  description: string;
};

export default function QuizForm({ quiz, onSuccess }: QuizFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!quiz;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      name: quiz?.name || "",
      description: quiz?.description || "",
    },
  });

  const mutation = useMutation({
    // MUDANÇA: A lógica da mutação agora chama as funções corretas.
    mutationFn: (data: FormValues) => {
      if (isEditing && quiz) {
        // Para editar, passamos o ID da fase e os novos dados.
        return updateQuiz(quiz.phase_id, data);
      }
      // Para criar, passamos apenas os dados.
      return createQuiz(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast.success(`Quiz ${isEditing ? "atualizado" : "criado"} com sucesso!`);
      onSuccess();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => mutation.mutate(data);

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
          {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Quiz" : "Criar Quiz"}
        </Button>
      </div>
    </form>
  );
}