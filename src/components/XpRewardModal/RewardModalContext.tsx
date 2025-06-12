// ARQUIVO: src/components/XpRewardModal/RewardModalContext.tsx
// CÓDIGO CORRIGIDO - PROBLEMAS DE TIMING E ESTADO RESOLVIDOS

import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { XpRewardModal } from './XpRewardModal';

interface RewardModalData {
  xpAmount: number;
  title: string;
}

interface RewardModalContextType {
  showRewardModal: (data: RewardModalData) => void;
  hideRewardModal: () => void;
  isModalOpen: boolean;
}

const RewardModalContext = createContext<RewardModalContextType | undefined>(undefined);

export const RewardModalProvider = ({ children }: { children: ReactNode }) => {
  const [reward, setReward] = useState<RewardModalData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showRewardModal = useCallback((data: RewardModalData) => {
    // Se já há um modal aberto, aguarda um pouco antes de mostrar o próximo
    if (isModalOpen) {
      setTimeout(() => {
        setReward(data);
        setIsModalOpen(true);
      }, 300);
    } else {
      setReward(data);
      setIsModalOpen(true);
    }
  }, [isModalOpen]);

  const hideRewardModal = useCallback(() => {
    setIsModalOpen(false);
    // Aguarda a animação de saída completar antes de limpar os dados
    setTimeout(() => {
      setReward(null);
    }, 300);
  }, []);

  return (
    <RewardModalContext.Provider value={{ 
      showRewardModal, 
      hideRewardModal, 
      isModalOpen 
    }}>
      {children}
      
      {/* O modal só é renderizado quando há dados */}
      {reward && (
        <XpRewardModal
          isOpen={isModalOpen}
          onClose={hideRewardModal}
          xpAmount={reward.xpAmount}
          title={reward.title}
        />
      )}
    </RewardModalContext.Provider>
  );
};

export const useRewardModal = () => {
  const context = useContext(RewardModalContext);
  if (context === undefined) {
    throw new Error('useRewardModal must be used within a RewardModalProvider');
  }
  return context;
};