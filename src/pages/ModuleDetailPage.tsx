
import { useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import PhaseCard from "@/components/PhaseCard";
import ProgressBar from "@/components/ProgressBar";

const ModuleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const moduleId = parseInt(id || "1");
  
  // Dados do módulo baseados no ID
  const moduleData = {
    1: {
      title: "Mestre de Si",
      description: "Conheça suas forças, fraquezas e o que te move",
      type: "autoconhecimento" as const,
      progress: 75,
      emoji: "🧠",
      color: "bg-yellow-100",
    },
    2: {
      title: "Olhar do Outro",
      description: "Desenvolva a capacidade de entender pessoas",
      type: "empatia" as const,
      progress: 25,
      emoji: "❤️",
      color: "bg-red-100",
    },
    3: {
      title: "Mente Infinita",
      description: "Desbloqueie seu potencial de crescimento contínuo",
      type: "growth" as const,
      progress: 0,
      emoji: "🌱",
      color: "bg-green-100",
    },
    4: {
      title: "Papo Reto",
      description: "Aprenda a comunicação eficaz e persuasiva",
      type: "comunicacao" as const,
      progress: 0,
      emoji: "💬",
      color: "bg-blue-100",
    },
  }[moduleId] || {
    title: "Módulo",
    description: "Descrição do módulo",
    type: "autoconhecimento" as const,
    progress: 0,
    emoji: "📚",
    color: "bg-gray-100",
  };

  // Fases do módulo
  const phases = [
    {
      moduleId,
      phaseId: 1,
      title: "Raio-X da Personalidade",
      description: "Descubra seus pontos fortes e fracos",
      duration: 15,
      status: "completed" as const,
      iconType: "quiz" as const,
    },
    {
      moduleId,
      phaseId: 2,
      title: "Potências e Limites",
      description: "Conheça o que te impulsiona e te freia",
      duration: 20,
      status: "inProgress" as const,
      iconType: "video" as const,
    },
    {
      moduleId,
      phaseId: 3,
      title: "Valores e Propósitos",
      description: "Identifique o que realmente importa para você",
      duration: 15,
      status: "available" as const,
      iconType: "challenge" as const,
    },
    {
      moduleId,
      phaseId: 4,
      title: "Plano de Desenvolvimento",
      description: "Crie estratégias para evoluir continuamente",
      duration: 15,
      status: "locked" as const,
      iconType: "game" as const,
    },
  ];

  // Detalhes visuais baseados no tipo
  const typeConfig = {
    autoconhecimento: {
      color: "yellow",
      icon: "🧠",
    },
    empatia: {
      color: "red",
      icon: "❤️",
    },
    growth: {
      color: "green",
      icon: "🌱",
    },
    comunicacao: {
      color: "blue",
      icon: "💬",
    },
  };

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title={moduleData.title} />

      <div className={`${moduleData.color} p-6`}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            {moduleData.emoji}
          </div>
          <div>
            <h2 className="text-xl font-bold">{moduleData.title}</h2>
            <p className="text-sm text-gray-600">{moduleData.description}</p>
          </div>
        </div>

        <div className="mb-1 flex justify-between">
          <span className="text-sm font-medium">Progresso</span>
          <span className="text-sm">{moduleData.progress}%</span>
        </div>
        <ProgressBar progress={moduleData.progress} />
      </div>

      <div className="container px-4 py-6 space-y-4">
        <h3 className="font-bold">Fases da Jornada</h3>
        <div className="space-y-3">
          {phases.map((phase) => (
            <PhaseCard 
              key={`${phase.moduleId}-${phase.phaseId}`}
              {...phase}
            />
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ModuleDetailPage;
