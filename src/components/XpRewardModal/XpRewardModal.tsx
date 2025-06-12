// ARQUIVO: src/components/XpRewardModal/XpRewardModal.tsx
// NENHUMA ALTERAÇÃO NECESSÁRIA AQUI

import React, { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

interface XpRewardModalProps {
  xpAmount: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const XpRewardModal: React.FC<XpRewardModalProps> = ({ 
  xpAmount, 
  isOpen, 
  onClose, 
  title = "Recompensa!" 
}) => {
  // Efeito que fecha o modal automaticamente após 2.5 segundos
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 w-full max-w-xs mx-auto"
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 15 }}
                  className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full shadow-lg"
                >
                  <Star className="w-10 h-10 text-yellow-500 fill-yellow-400" />
                </motion.div>
                <Dialog.Title className="text-2xl font-bold text-slate-800 text-center">
                  {title}
                </Dialog.Title>
                <motion.div
                  className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                >
                  +{xpAmount} XP
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};