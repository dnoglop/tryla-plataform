import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { YoutubeEmbed } from "@/components/YoutubeEmbed";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { getPhase } from "@/services/moduleService";

interface PhaseDetailPageParams {
  moduleId: string;
  phaseId: string;
}

interface Phase {
  id: number;
  name: string;
  description?: string;
  type?: string;
  icon_type?: string;
  content?: string;
  videoUrl?: string;
  videoNotes?: string;
  videoId?: string;
  images?: string[];
}

const PhaseDetailPage = () => {
  const { moduleId, phaseId } = useParams<PhaseDetailPageParams>();
  const navigate = useNavigate();
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhase = async () => {
      if (moduleId && phaseId) {
        setLoading(true);
        try {
          const phase = await getPhase(Number(phaseId));
          if (phase) {
            setSelectedPhase(phase);
          } else {
            // If phase is not found, redirect to a 404 page or back to the module page
            navigate("/404"); // You might want to create a 404 page
          }
        } catch (error) {
          console.error("Failed to load phase:", error);
          // Handle error appropriately
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPhase();
  }, [moduleId, phaseId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-trilha-orange border-t-transparent"></div>
      </div>
    );
  }

  if (!selectedPhase) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Fase não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header title={selectedPhase.name} showBackButton={true} />

      <div className="container px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{selectedPhase.name}</h2>
          {selectedPhase.description && (
            <p className="text-gray-600 mt-2">{selectedPhase.description}</p>
          )}
        </div>

        {selectedPhase.type === "video" && selectedPhase.videoId && (
          <YoutubeEmbed videoId={selectedPhase.videoId} />
        )}

        {selectedPhase.type === "video" && selectedPhase.videoId && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Observações sobre o vídeo</h3>
          <div className="bg-gray-50 p-4 rounded-lg border">
            {selectedPhase.videoNotes ? (
              <p className="text-sm text-gray-700 whitespace-pre-line">{selectedPhase.videoNotes}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">Sem observações para este vídeo</p>
            )}
          </div>
        </div>
      )}

        {selectedPhase.type === "text" && (
          <div
            className="mt-6 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedPhase.content || "" }}
          />
        )}

        {selectedPhase.type === "text" && selectedPhase.images && selectedPhase.images.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Imagens</h3>
            <div className="flex flex-wrap gap-4">
              {selectedPhase.images.map((image, index) => (
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

        {selectedPhase.type === "quiz" && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Quiz</h3>
            <p>Em breve...</p>
          </div>
        )}

        {selectedPhase.type === "challenge" && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Desafio</h3>
            <p>Em breve...</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PhaseDetailPage;
