import React from "react";
import { useForm, useFieldArray, Controller, SubmitHandler } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQuestion, updateQuestion, type Question, type Quiz } from "@/services/quizService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, PlusCircle } from "lucide-react";

interface QuestionFormProps {
  quiz: Quiz;
  question?: Question;
  onSuccess: () => void;
}

type FormValues = {
  question: string;
  options: { value: string }[];
  correct_answer: string; // Usamos string para o valor do RadioGroup
  order_index: number;
  tips_question: string;
};

export default function QuestionForm({ quiz, question, onSuccess }: QuestionFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!question;

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      question: question?.question || "",
      options: question?.options.map(opt => ({ value: opt })) || [{ value: "" }, { value: "" }],
      correct_answer: question?.correct_answer.toString() || "0",
      order_index: question?.order_index || 0,
      tips_question: question?.tips_question || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
        const preparedData = {
            ...data,
            quiz_id: quiz.id,
            options: data.options.map((opt: {value: string}) => opt.value),
            correct_answer: parseInt(data.correct_answer, 10),
        };
        if (isEditing && question) {
            return updateQuestion(question.id, preparedData);
        }
        return createQuestion(preparedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", quiz.id] });
      toast.success(`Pergunta ${isEditing ? "atualizada" : "criada"} com sucesso!`);
      onSuccess();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="question">Texto da Pergunta *</Label>
        <Textarea id="question" {...register("question", { required: "A pergunta é obrigatória." })} />
        {errors.question && <p className="text-destructive text-sm mt-1">{errors.question.message}</p>}
      </div>

      <div>
        <Label>Opções de Resposta e Resposta Correta *</Label>
        <Controller
          name="correct_answer"
          control={control}
          render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} value={field.value} className="mt-2 space-y-3">
              {fields.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <RadioGroupItem value={index.toString()} id={`correct_answer_${index}`} />
                  <Input
                    placeholder={`Opção ${index + 1}`}
                    {...register(`options.${index}.value` as const, { required: true })}
                    className="flex-grow"
                  />
                  {fields.length > 2 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </RadioGroup>
          )}
        />
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => append({ value: "" })}>
            <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Opção
        </Button>
      </div>

      <div>
        <Label htmlFor="tips_question">Dica para a Pergunta</Label>
        <Textarea id="tips_question" placeholder="Uma dica que ajude o usuário a encontrar a resposta." {...register("tips_question")} />
      </div>

      <div>
        <Label htmlFor="order_index">Ordem da Pergunta</Label>
        <Input id="order_index" type="number" {...register("order_index", { valueAsNumber: true })} />
        <p className="text-muted-foreground text-xs mt-1">Define a posição da pergunta no quiz.</p>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Pergunta" : "Criar Pergunta"}
        </Button>
      </div>
    </form>
  );
}