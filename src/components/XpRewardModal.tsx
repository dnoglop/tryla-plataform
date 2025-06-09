// src/components/XpRewardModal.tsx

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

interface XpRewardModalProps {
  xpAmount: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const XpRewardModal: React.FC<XpRewardModalProps> = ({ xpAmount, isOpen, onClose, title = "Recompensa!" }) => {
  // Fecha o modal automaticamente após alguns segundos
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500); // Fecha após 2.5 segundos
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/30 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 p-6 bg-white rounded-2xl shadow-2xl flex flex-col items-center gap-4 w-[90vw] max-w-xs"
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="p-4 bg-yellow-100 rounded-full"
                >
                  <Star className="w-10 h-10 text-yellow-500 fill-yellow-400" />
                </motion.div>
                
                <Dialog.Title className="text-2xl font-bold text-slate-800 text-center">
                  {title}
                </Dialog.Title>
                
                <motion.p 
                  className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  +{xpAmount} XP
                </motion.p>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
};