// ARQUIVO: src/components/XpRewardModal/XpRewardModal.tsx
// VERSÃO CORRIGIDA COM TIMING E ANIMAÇÕES AJUSTADAS

import React, { useEffect, useState } from 'react';
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
  const [shouldClose, setShouldClose] = useState(false);
  
  // Debug logs
  useEffect(() => {
    console.log('🎭 XpRewardModal - isOpen:', isOpen, 'xpAmount:', xpAmount);
  }, [isOpen, xpAmount]);

  // Efeito que fecha o modal automaticamente após 2.5 segundos
  useEffect(() => {
    if (isOpen && !shouldClose) {
      console.log('⏰ Timer iniciado para fechar modal em 2.5s');
      const timer = setTimeout(() => {
        console.log('⏰ Timer executado - fechando modal');
        setShouldClose(true);
        onClose();
      }, 2500);
      
      return () => {
        console.log('⏰ Timer cancelado');
        clearTimeout(timer);
      };
    }
  }, [isOpen, onClose, shouldClose]);

  // Reset shouldClose quando modal abre
  useEffect(() => {
    if (isOpen) {
      setShouldClose(false);
    }
  }, [isOpen]);

  // Função para fechar manualmente (se usuário clicar)
  const handleClose = () => {
    console.log('👆 Modal fechado manualmente');
    setShouldClose(true);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal forceMount>
        <AnimatePresence mode="wait">
          {isOpen && (
            <>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </Dialog.Overlay>
              
              <Dialog.Content 
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                forceMount
                asChild
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 w-full max-w-xs mx-auto border-4 border-yellow-400"
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -20 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      damping: 25,
                      duration: 0.3
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Efeito de partículas */}
                    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                          initial={{ 
                            x: '50%', 
                            y: '50%', 
                            scale: 0, 
                            opacity: 1 
                          }}
                          animate={{ 
                            x: `${50 + (Math.cos(i * 45 * Math.PI / 180) * 150)}%`, 
                            y: `${50 + (Math.sin(i * 45 * Math.PI / 180) * 150)}%`, 
                            scale: [0, 1, 0], 
                            opacity: [1, 1, 0] 
                          }}
                          transition={{ 
                            duration: 1.5, 
                            delay: 0.3 + i * 0.1,
                            ease: "easeOut"
                          }}
                        />
                      ))}
                    </div>

                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        delay: 0.2, 
                        type: 'spring', 
                        stiffness: 400, 
                        damping: 15 
                      }}
                      className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-600 dark:to-yellow-700 rounded-full shadow-lg"
                    >
                      <Star className="w-10 h-10 text-yellow-500 fill-yellow-400" />
                    </motion.div>

                    <Dialog.Title className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center">
                      {title}
                    </Dialog.Title>

                    <motion.div
                      className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        delay: 0.4, 
                        type: 'spring', 
                        stiffness: 200,
                        duration: 0.5
                      }}
                    >
                      +{xpAmount} XP
                    </motion.div>

                    <motion.div
                      className="text-sm text-slate-600 dark:text-slate-400 text-center mt-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      Continue assim! 🚀
                    </motion.div>

                    {/* Botão para fechar manualmente (opcional) */}
                    <motion.button
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-bold"
                      onClick={handleClose}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ×
                    </motion.button>
                  </motion.div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
};