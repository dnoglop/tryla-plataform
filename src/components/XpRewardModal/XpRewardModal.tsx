// ARQUIVO: src/components/XpRewardModal/XpRewardModal.tsx
// CÓDIGO CORRIGIDO - PROBLEMAS DE LAYOUT RESOLVIDOS

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
          <Dialog.Portal>
            {/* Overlay com z-index mais alto e posicionamento correto */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                style={{ zIndex: 9998 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/* Content com posicionamento absoluto e z-index ainda mais alto */}
            <Dialog.Content asChild>
              <motion.div
                className="fixed inset-0 flex items-center justify-center p-4"
                style={{ zIndex: 9999 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 w-full max-w-xs mx-auto"
                  initial={{ scale: 0.5, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: -20 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 25,
                    duration: 0.3
                  }}
                >
                  {/* Ícone da estrela com animação */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.2, 
                      type: 'spring',
                      stiffness: 400,
                      damping: 15
                    }}
                    className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full shadow-lg"
                  >
                    <Star className="w-10 h-10 text-yellow-500 fill-yellow-400" />
                  </motion.div>
                  
                  {/* Título */}
                  <Dialog.Title asChild>
                    <motion.h2 
                      className="text-2xl font-bold text-slate-800 text-center"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {title}
                    </motion.h2>
                  </Dialog.Title>
                  
                  {/* XP Amount */}
                  <motion.div
                    className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      delay: 0.4,
                      type: 'spring',
                      stiffness: 200
                    }}
                  >
                    +{xpAmount} XP
                  </motion.div>

                  {/* Efeito de partículas/brilho opcional */}
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full opacity-60"
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: [0, 1.2, 0],
                      opacity: [0, 0.8, 0]
                    }}
                    transition={{
                      delay: 0.6,
                      duration: 1,
                      repeat: Infinity,
                      repeatDelay: 0.5
                    }}
                  />
                  
                  <motion.div
                    className="absolute -bottom-1 -left-1 w-4 h-4 bg-orange-400 rounded-full opacity-50"
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 0.6, 0]
                    }}
                    transition={{
                      delay: 0.8,
                      duration: 0.8,
                      repeat: Infinity,
                      repeatDelay: 0.7
                    }}
                  />
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};