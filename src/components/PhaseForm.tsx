import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/RichTextEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phase, createPhase, updatePhase } from "@/services/moduleService";

interface PhaseFormProps {
  moduleId: number;
  phase?: Phase;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const PhaseForm = ({ moduleId, phase, isOpen, onClose, onSave }: PhaseFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "video",
    icon_type: "video",
    content: "",
    video_url: "",
    video_notes: "",
    duration: 15,
    order_index: 0,
  });

  useEffect(() => {
    if (phase) {
      setFormData({
        name: phase.name || "",
        description: phase.description || "",
        type: phase.type || "video",
        icon_type: phase.icon_type || "video",
        content: phase.content || "",
        video_url: phase.video_url || "",
        video_notes: phase.video_notes || "",
        duration: phase.duration || 15,
        order_index: phase.order_index || 0,
      });
    } else {
      // Reset form for new phases
      setFormData({
        name: "",
        description: "",
        type: "video",
        icon_type: "video",
        content: "",
        video_url: "",
        video_notes: "",
        duration: 15,
        order_index: 0,
      });
    }
  }, [phase, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({ ...prev, content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const phaseData = {
        ...formData,
        module_id: moduleId,
        duration: Number(formData.duration),
        order_index: Number(formData.order_index),
      };

      if (phase) {
        // Update existing phase
        await updatePhase(phase.id, phaseData);
      } else {
        // Create new phase
        await createPhase(phaseData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving phase:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{phase ? "Editar Fase" : "Nova Fase"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da fase</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de fase</Label>
              <select
                id="type"
                name="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="video">Vídeo</option>
                <option value="text">Texto</option>
                <option value="quiz">Quiz</option>
                <option value="challenge">Desafio</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon_type">Tipo de ícone</Label>
              <select
                id="icon_type"
                name="icon_type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.icon_type}
                onChange={handleChange}
              >
                <option value="video">Vídeo</option>
                <option value="quiz">Quiz</option>
                <option value="challenge">Desafio</option>
                <option value="game">Jogo</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_index">Ordem</Label>
              <Input
                id="order_index"
                name="order_index"
                type="number"
                min="0"
                value={formData.order_index}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição breve</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
            />
          </div>

          {(formData.type === "video" || formData.type === "text") && (
            <div className="space-y-2">
              <Label htmlFor="video_url">URL do vídeo (YouTube)</Label>
              <Input
                id="video_url"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          )}

          {formData.type === "video" && (
            <div className="space-y-2">
              <Label htmlFor="video_notes">Observações do vídeo</Label>
              <Textarea
                id="video_notes"
                name="video_notes"
                value={formData.video_notes}
                onChange={handleChange}
                rows={3}
                placeholder="Adicione aqui observações importantes sobre o vídeo..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            {formData.type === "text" || formData.type === "quiz" || formData.type === "challenge" ? (
              <RichTextEditor 
                value={formData.content} 
                onChange={handleContentChange} 
              />
            ) : (
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="bg-trilha-orange hover:bg-trilha-orange/90"
            >
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : phase ? (
                "Atualizar Fase"
              ) : (
                "Criar Fase"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PhaseForm;
