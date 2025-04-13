
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import YoutubeEmbed from "@/components/YoutubeEmbed";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { getPhaseById, getPhasesByModuleId, Phase, updateUserPhaseStatus } from "@/services/moduleService";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PhaseDetailPage = () => {
  const { moduleId, phaseId } = useParams<{ moduleId: string; phaseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    
    getUser();
  }, []);

  // Fetch current phase data
  const { data: phase, isLoading: isLoadingPhase } = useQuery({
    queryKey: ['phase', Number(phaseId)],
    queryFn: () => getPhaseById(Number(phaseId)),
    enabled: !!phaseId,
  });

  // Fetch all phases from the module to determine next/prev
  const { data: phases = [], isLoading: isLoadingPhases } = useQuery({
    queryKey: ['phases', Number(moduleId)],
    queryFn: () => getPhasesByModuleId(Number(moduleId)),
    enabled: !!moduleId,
  });

  // Update loading state based on data fetching status
  useEffect(() => {
    if (!isLoadingPhase && !isLoadingPhases) {
      setLoading(false);
    }
  }, [isLoadingPhase, isLoadingPhases]);

  // Find current phase index and next/prev phases
  const currentPhaseIndex = phases.findIndex(p => p.id === Number(phaseId));
  const prevPhase = currentPhaseIndex > 0 ? phases[currentPhaseIndex - 1] : null;
  const nextPhase = currentPhaseIndex < phases.length - 1 ? phases[currentPhaseIndex + 1] : null;

  // Mark phase as in progress when visited
  useEffect(() => {
    const markPhaseInProgress = async () => {
      if (phase && user) {
        try {
          await updateUserPhaseStatus(user.id, Number(phaseId), "inProgress");
        } catch (error) {
          console.error("Error updating phase status:", error);
        }
      }
    };

    if (phase && user) {
      markPhaseInProgress();
    }
  }, [phase, phaseId, user]);

  // Handle completing the phase
  const handleCompletePhase = async () => {
    if (user) {
      try {
        await updateUserPhaseStatus(user.id, Number(phaseId), "completed");
        toast.success("Fase concluída com sucesso!");
        
        // Navigate to next phase if available
        if (nextPhase) {
          navigate(`/fase/${moduleId}/${nextPhase.id}`);
        } else {
          navigate(`/modulo/${moduleId}`);
        }
      } catch (error) {
        toast.error("Erro ao marcar fase como concluída");
        console.error("Error completing phase:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-trilha-orange border-t-transparent"></div>
      </div>
    );
  }

  if (!phase) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Fase não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header title={phase.name} showBackButton={true} />

      <div className="container px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{phase.name}</h2>
          {phase.description && (
            <p className="text-gray-600 mt-2">{phase.description}</p>
          )}
        </div>

        {phase.type === "video" && phase.videoId && (
          <YoutubeEmbed videoId={phase.videoId} />
        )}

        {phase.type === "video" && phase.video_notes && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Observações sobre o vídeo</h3>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm text-gray-700 whitespace-pre-line">{phase.video_notes}</p>
            </div>
          </div>
        )}

        {phase.type === "text" && (
          <div
            className="mt-6 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: phase.content || "" }}
          />
        )}

        {phase.type === "text" && phase.images && phase.images.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Imagens</h3>
            <div className="flex flex-wrap gap-4">
              {phase.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Imagem ${index + 1}`}
                  className="rounded-lg shadow-md"
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                />
              ))}
            </div>
          </div>
        )}

        {phase.type === "quiz" && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Quiz</h3>
            <p>Em breve...</p>
          </div>
        )}

        {phase.type === "challenge" && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Desafio</h3>
            <p>Em breve...</p>
          </div>
        )}

        <div className="mt-8">
          {/* Navigation and Complete button */}
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              {prevPhase && (
                <Link 
                  to={`/fase/${moduleId}/${prevPhase.id}`} 
                  className="flex items-center text-gray-600 hover:text-trilha-orange"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="text-sm">Anterior</span>
                </Link>
              )}
            </div>
            
            <Button onClick={handleCompletePhase} className="bg-trilha-orange hover:bg-trilha-orange/90">
              Concluir
            </Button>
            
            <div>
              {nextPhase && (
                <Link 
                  to={`/fase/${moduleId}/${nextPhase.id}`} 
                  className="flex items-center text-gray-600 hover:text-trilha-orange"
                >
                  <span className="text-sm">Próximo</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PhaseDetailPage;
