
import React from "react";
import { Button } from "@/components/ui/button";

interface FormFooterProps {
  isSubmitting: boolean;
  isEditing: boolean;
  onCancel?: () => void;
}

const FormFooter = ({ isSubmitting, isEditing, onCancel }: FormFooterProps) => {
  return (
    <div className="flex justify-end gap-3">
      {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
      </Button>
    </div>
  );
};

export default FormFooter;
