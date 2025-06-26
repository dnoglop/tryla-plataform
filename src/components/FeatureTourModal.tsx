// ARQUIVO: src/components/FeatureTourModal.tsx (VERSÃO FINAL E AUTOSSUFICIENTE)

import React, { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Home,
  BookOpen,
  Users,
  Wrench,
  User,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipagem para cada passo do tour
interface TourStep {
  icon: React.ElementType;
  title: string;
  description: string;
}

// Conteúdo dos Passos do Tour (definido DENTRO do componente)
const tourSteps: TourStep[] = [
  {
    icon: Home,
    title: "Sua Base de Operações",
    description:
      "Aqui no Início, você acompanha seu progresso diário, vê seus desafios e pega sua próxima grande missão na jornada. É o seu QG!",
  },
  {
    icon: BookOpen,
    title: "Explore Novas Trilhas",
    description:
      "Em Módulos, você encontra todas as jornadas de aprendizado. Escolha uma, complete as fases e suba de nível!",
  },
  {
    icon: Users,
    title: "Conecte-se com a Galera",
    description:
      "A aba Social é onde a mágica acontece em grupo. Veja o ranking, interaja e mostre suas conquistas! (Chegando em breve!)",
  },
  {
    icon: Wrench,
    title: "Use seu Arsenal de Skills",
    description:
      "No Lab, você encontra ferramentas poderosas como o 'Match de Carreira' e o 'Timer de Sprint' para turbinar seu desenvolvimento.",
  },
  {
    icon: User,
    title: "Sua Sala de Troféus",
    description:
      "No seu Perfil, você vê todas as suas estatísticas, nível e conquistas. É o seu hall da fama pessoal!",
  },
  {
    icon: Bell,
    title: "Não Perca Nada!",
    description:
      "Ative as notificações para saber sobre novos desafios e recompensas. Você pode fazer isso nas Configurações do seu perfil.",
  },
];

interface FeatureTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureTourModal = ({
  isOpen,
  onClose,
}: FeatureTourModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const totalSteps = tourSteps.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      const nextStepIndex = currentStep + 1;
      const container = scrollContainerRef.current;
      if (container) {
        const scrollAmount = container.offsetWidth * nextStepIndex;
        container.scrollTo({ left: scrollAmount, behavior: "smooth" });
      }
      setCurrentStep(nextStepIndex);
    } else {
      onClose(); // Finaliza o tour
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const newStep = Math.round(container.scrollLeft / container.offsetWidth);
      if (newStep !== currentStep) {
        setCurrentStep(newStep);
      }
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col justify-center items-center p-4"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="w-full max-w-md h-auto max-h-[80vh] bg-card rounded-3xl shadow-2xl flex flex-col overflow-hidden border"
          >
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: "none", "-ms-overflow-style": "none" }}
            >
              {tourSteps.map((step, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 snap-center flex flex-col justify-center items-center text-center p-8 sm:p-10 min-h-[50vh]"
                >
                  <motion.div
                    initial={{ scale: 0.5, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6"
                  >
                    <step.icon className="w-12 h-12 text-primary" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">
                    {step.title}
                  </h2>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-6 border-t flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      index === currentStep ? "w-6 bg-primary" : "w-2 bg-muted",
                    )}
                  />
                ))}
              </div>
              <Button
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 rounded-full font-bold"
              >
                {currentStep === totalSteps - 1 ? (
                  <>
                    Vamos lá! <Check className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Próximo <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
