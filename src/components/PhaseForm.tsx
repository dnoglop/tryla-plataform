
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createPhase, updatePhase, PhaseType, IconType } from "@/services/moduleService";
import FormHeader from "./phase-form/FormHeader";
import TextContent from "./phase-form/TextContent";
import VideoContent from "./phase-form/VideoContent";
import FormFooter from "./phase-form/FormFooter";

interface PhaseFormProps {
  moduleId: number;
  phase?: {
    id: number;
    name: string;
    description?: string;
    type?: string;
    icon_type?: string;
    content?: string;
    video_url?: string;
    video_notes?: string;
    duration?: number;
    order_index: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PhaseForm = ({ moduleId, phase, onSuccess, onCancel }: PhaseFormProps) => {
  const isEditing = !!phase;
  const [content, setContent] = useState(phase?.content || "");
  const [videoNotes, setVideoNotes] = useState(phase?.video_notes || "");
  const [phaseType, setPhaseType] = useState<PhaseType>(
    (phase?.type as PhaseType) || "text"
  );
  const [iconType, setIconType] = useState<IconType>(
    (phase?.icon_type as IconType) || "challenge"
  );
  const [videoUrl, setVideoUrl] = useState(phase?.video_url || "");

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: phase?.name || "",
      description: phase?.description || "",
      type: phase?.type || "text",
      icon_type: phase?.icon_type || "challenge",
      video_url: phase?.video_url || "",
      duration: phase?.duration || 15,
      order_index: phase?.order_index || 0
    }
  });

  // Update watched video URL for preview
  const watchedVideoUrl = watch("video_url");
  
  useEffect(() => {
    if (phase) {
      setValue("name", phase.name || "");
      setValue("description", phase.description || "");
      setValue("type", phase.type || "text");
      setValue("icon_type", phase.icon_type || "challenge");
      setValue("video_url", phase.video_url || "");
      setValue("duration", phase.duration || 15);
      setValue("order_index", phase.order_index || 0);
      setContent(phase.content || "");
      setVideoNotes(phase.video_notes || "");
      setPhaseType((phase.type as PhaseType) || "text");
      setIconType((phase.icon_type as IconType) || "challenge");
      setVideoUrl(phase.video_url || "");
    }
  }, [phase, setValue]);

  useEffect(() => {
    setVideoUrl(watchedVideoUrl);
  }, [watchedVideoUrl]);

  const onSubmit = async (data: any) => {
    try {
      const phaseData = {
        module_id: moduleId,
        name: data.name,
        description: data.description,
        type: phaseType,
        icon_type: iconType,
        content,
        video_url: data.video_url,
        video_notes: videoNotes,
        duration: Number(data.duration),
        order_index: Number(data.order_index),
      };

      if (isEditing && phase) {
        await updatePhase(phase.id, phaseData);
        toast.success("Fase atualizada com sucesso!");
      } else {
        await createPhase(phaseData as any);
        toast.success("Fase criada com sucesso!");
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving phase:", error);
      toast.error("Erro ao salvar a fase. Tente novamente.");
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("name", e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue("description", e.target.value);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("duration", parseInt(e.target.value) || 15);
  };

  const handleOrderIndexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("order_index", parseInt(e.target.value) || 0);
  };

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("video_url", e.target.value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormHeader
        name={watch("name")}
        description={watch("description")}
        phaseType={phaseType}
        iconType={iconType}
        duration={watch("duration")}
        orderIndex={watch("order_index")}
        onNameChange={handleNameChange}
        onDescriptionChange={handleDescriptionChange}
        onPhaseTypeChange={setPhaseType}
        onIconTypeChange={setIconType}
        onDurationChange={handleDurationChange}
        onOrderIndexChange={handleOrderIndexChange}
        errors={errors}
      />

      {phaseType === "text" && (
        <TextContent content={content} onChange={setContent} />
      )}

      {phaseType === "challenge" && (
        <TextContent content={content} onChange={setContent} />
      )}

      {phaseType === "video" && (
        <VideoContent
          videoUrl={videoUrl}
          videoNotes={videoNotes}
          onVideoUrlChange={handleVideoUrlChange}
          onVideoNotesChange={setVideoNotes}
        />
      )}

      <FormFooter
        isSubmitting={isSubmitting}
        isEditing={isEditing}
        onCancel={onCancel}
      />
    </form>
  );
};

export default PhaseForm;
