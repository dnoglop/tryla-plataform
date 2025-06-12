// ARQUIVO: src/components/XpRewardModal/RewardModalContext.tsx
// VERSÃO FINAL COM LÓGICA DE PROMISE

import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import { XpRewardModal } from './XpRewardModal';

interface RewardModalData {
  xpAmount: number;
  title: string;
}

// A função showRewardModal agora retorna uma Promise<void>
interface RewardModalContextType {
  showRewardModal: (data: RewardModalData) => Promise<void>;
  isModalOpen: boolean;
}

const RewardModalContext = createContext<RewardModalContextType | undefined>(undefined);

// A fila agora armazena os dados e a função 'resolve' da Promise
type RewardQueueItem = {
  data: RewardModalData;
  resolve: () => void;
};

export const RewardModalProvider = ({ children }: { children: ReactNode }) => {
  const [rewardQueue, setRewardQueue] = useState<RewardQueueItem[]>([]);
  const [currentReward, setCurrentReward] = useState<RewardQueueItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Adiciona um novo modal à fila e retorna uma Promise que será resolvida quando o modal fechar
  const showRewardModal = useCallback((data: RewardModalData) => {
    return new Promise<void>((resolve) => {
      setRewardQueue(prevQueue => [...prevQueue, { data, resolve }]);
    });
  }, []);

  // Fecha o modal e resolve a Promise, permitindo que o código que chamou continue
  const hideRewardModal = useCallback(() => {
    if (currentReward) {
      currentReward.resolve();
    }
    setIsModalOpen(false);
    setCurrentReward(null); // Limpa o modal atual
  }, [currentReward]);
  
  // Processa a fila
  useEffect(() => {
    if (rewardQueue.length > 0 && !isModalOpen) {
      const nextReward = rewardQueue[0];
      setRewardQueue(prevQueue => prevQueue.slice(1));
      setCurrentReward(nextReward);
      setIsModalOpen(true);
    }
  }, [rewardQueue, isModalOpen]);

  return (
    <RewardModalContext.Provider value={{ showRewardModal, isModalOpen }}>
      {children}
      {currentReward && (
        <XpRewardModal
          isOpen={isModalOpen}
          onClose={hideRewardModal}
          xpAmount={currentReward.data.xpAmount}
          title={currentReward.data.title}
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