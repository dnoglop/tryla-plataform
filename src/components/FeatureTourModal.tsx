// ARQUIVO: src/components/FeatureTourModal.tsx

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils'; // Importe seu utilitário de classes condicionais

// Tipagem para cada passo do tour
interface TourStep {
  image: string;
  title: string;
  description: string;
}

interface FeatureTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TourStep[];
}

export const FeatureTourModal = ({ isOpen, onClose, steps }: FeatureTourModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose(); // Se for o último passo, fecha o modal
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const stepData = steps[currentStep];
  if (!stepData) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 animate-in fade-in-0" />
        {/*
          MODIFICAÇÕES PRINCIPAIS NO LAYOUT DO MODAL
          - Ajustes de posicionamento e tamanho para mobile
        */}
        <Dialog.Content 
          className="fixed bottom-4 left-4 right-4 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-auto max-w-md bg-card p-0 rounded-2xl shadow-xl z-50 flex flex-col animate-in fade-in-0 zoom-in-95 data-[state=open]:sm:animate-in-from-bottom"
        >
          
          {/* Imagem no topo */}
          <div className="w-full h-48 sm:h-52 overflow-hidden rounded-t-2xl">
            <img src={stepData.image} alt={stepData.title} className="w-full h-full object-cover" />
          </div>

          {/* Conteúdo de texto */}
          <div className="p-6 text-center flex-grow">
            <h2 className="text-xl font-bold text-foreground mb-2">{stepData.title}</h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              {stepData.description}
            </p>
          </div>

          {/* Navegação no rodapé */}
          <div className="p-4 sm:p-6 border-t flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            {/* Indicadores de passo */}
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div 
                  key={index} 
                  className={cn(
                    'h-2 rounded-full transition-all duration-300', 
                    index === currentStep ? 'w-6 bg-primary' : 'w-2 bg-muted'
                  )}
                />
              ))}
            </div>

            {/* Botões de navegação */}
            <div className="flex w-full sm:w-auto gap-2">
              {currentStep > 0 && (
                <Button variant="ghost" onClick={handlePrevious} className="flex-1 sm:flex-none">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
              )}
              <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none">
                {currentStep === totalSteps - 1 ? (
                  <>Finalizar <Check className="h-4 w-4 ml-2" /></>
                ) : (
                  <>
                    <span className="sm:hidden">Avançar</span>
                    <span className="hidden sm:inline">Próximo</span> 
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};