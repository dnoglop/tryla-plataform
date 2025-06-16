// ARQUIVO: src/components/XpRewardModal/RewardModalContext.tsx - VERSÃO COMPLETA E CORRIGIDA

import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import { XpRewardModal } from './XpRewardModal';

interface RewardModalData {
  xpAmount: number;
  title: string;
}

interface RewardModalContextType {
  showRewardModal: (data: RewardModalData) => Promise<void>;
}

const RewardModalContext = createContext<RewardModalContextType | undefined>(undefined);

type RewardQueueItem = {
  data: RewardModalData;
  resolve: () => void;
};

export const RewardModalProvider = ({ children }: { children: ReactNode }) => {
  const [rewardQueue, setRewardQueue] = useState<RewardQueueItem[]>([]);
  const [currentReward, setCurrentReward] = useState<RewardQueueItem | null>(null);

  // Função pública para adicionar uma recompensa à fila
  const showRewardModal = useCallback((data: RewardModalData): Promise<void> => {
    return new Promise<void>((resolve) => {
      const newItem: RewardQueueItem = { data, resolve };
      setRewardQueue(prevQueue => [...prevQueue, newItem]);
    });
  }, []);

  // Efeito para processar o próximo item da fila
  useEffect(() => {
    // Se não há uma recompensa sendo exibida e a fila tem itens, pega o próximo.
    if (!currentReward && rewardQueue.length > 0) {
      const nextReward = rewardQueue[0];
      setRewardQueue(prevQueue => prevQueue.slice(1)); // Remove o item da fila
      setCurrentReward(nextReward); // Define como o item atual a ser exibido
    }
  }, [rewardQueue, currentReward]);

  // Função para ser chamada quando o modal é fechado
  const handleClose = useCallback(() => {
    if (currentReward) {
      // 1. Resolve a Promise. Isso desbloqueia o `await` no PhaseDetailPage.
      currentReward.resolve();
      // 2. Limpa a recompensa atual, permitindo que o useEffect processe a próxima.
      setCurrentReward(null);
    }
  }, [currentReward]);

  return (
    <RewardModalContext.Provider value={{ showRewardModal }}>
      {children}
      {currentReward && (
        <XpRewardModal
          // O modal é considerado aberto sempre que houver uma 'currentReward'
          isOpen={!!currentReward} 
          onClose={handleClose}
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