import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Save, Edit3, Plus, X } from "lucide-react";

interface FormFooterProps {
  isSubmitting?: boolean;
  isEditing?: boolean;
  isValid?: boolean;
  isDirty?: boolean;
  onCancel?: () => void;
  onReset?: () => void;
  variant?: "default" | "glass" | "floating" | "compact";
  alignment?: "left" | "center" | "right" | "space-between";
  submitText?: string;
  cancelText?: string;
  showResetButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const FormFooter = ({ 
  isSubmitting = false,
  isEditing = false,
  isValid = true,
  isDirty = false,
  onCancel,
  onReset,
  variant = "default",
  alignment = "right",
  submitText,
  cancelText = "Cancelar",
  showResetButton = false,
  className,
  children
}: FormFooterProps) => {
  
  const getSubmitText = () => {
    if (submitText) return submitText;
    if (isSubmitting) return "Salvando...";
    if (isEditing) return "Atualizar";
    return "Salvar";
  };

  const getSubmitIcon = () => {
    if (isSubmitting) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (isEditing) return <Edit3 className="h-4 w-4" />;
    return <Save className="h-4 w-4" />;
  };

  const containerVariants = {
    default: "flex gap-3 pt-6 border-t border-slate-200/50",
    glass: cn(
      "flex gap-3 p-6 rounded-2xl",
      "bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg",
      "relative overflow-hidden",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent before:pointer-events-none"
    ),
    floating: cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 px-6 py-4 rounded-2xl",
      "bg-white/95 backdrop-blur-xl border border-white/20 shadow-xl",
      "z-50 transition-all duration-300",
      isDirty ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
    ),
    compact: "flex gap-2"
  };

  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    "space-between": "justify-between"
  };

  return (
    <div className={cn(
      containerVariants[variant],
      alignmentClasses[alignment],
      className
    )}>
      {/* Botões de ação secundária */}
      <div className="flex gap-2">
        {showResetButton && onReset && isDirty && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
        
        {onCancel && (
          <Button
            type="button"
            variant={variant === "glass" ? "ghost" : "outline"}
            onClick={onCancel}
            disabled={isSubmitting}
            className={cn(
              "transition-all duration-200",
              variant === "glass" && "backdrop-blur-sm bg-white/60 border-white/30 hover:bg-white/80",
              "hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            {cancelText}
          </Button>
        )}
      </div>

      {/* Conteúdo customizado */}
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}

      {/* Botão principal de submit */}
      <Button
        type="submit"
        disabled={isSubmitting || !isValid}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          "shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40",
          "hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
          variant === "glass" && "backdrop-blur-sm",
          !isValid && "opacity-60 cursor-not-allowed"
        )}
      >
        <span className="flex items-center gap-2">
          {getSubmitIcon()}
          {getSubmitText()}
        </span>
        
        {/* Efeito de loading */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-orange-600/20 animate-pulse" />
        )}
      </Button>

      {/* Indicador de progresso para variant floating */}
      {variant === "floating" && isDirty && (
        <div className="absolute -top-1 left-6 right-6 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full" />
      )}
    </div>
  );
};

// Componente adicional para status do formulário
interface FormStatusProps {
  isDirty?: boolean;
  isValid?: boolean;
  errorCount?: number;
  className?: string;
}

export const FormStatus = ({ 
  isDirty = false, 
  isValid = true, 
  errorCount = 0,
  className 
}: FormStatusProps) => {
  if (!isDirty) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-300",
      isValid 
        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
        : "bg-red-50 text-red-700 border border-red-200",
      className
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isValid ? "bg-emerald-500" : "bg-red-500"
      )} />
      <span>
        {isValid 
          ? "Pronto para salvar" 
          : `${errorCount} erro${errorCount !== 1 ? 's' : ''} encontrado${errorCount !== 1 ? 's' : ''}`
        }
      </span>
    </div>
  );
};

// Hook personalizado para gerenciar estado do footer
export const useFormFooter = (form: any) => {
  const { formState } = form;
  const { isSubmitting, isValid, isDirty, errors } = formState;
  
  return {
    isSubmitting,
    isValid,
    isDirty,
    errorCount: Object.keys(errors).length,
    hasErrors: Object.keys(errors).length > 0
  };
};

export default FormFooter;