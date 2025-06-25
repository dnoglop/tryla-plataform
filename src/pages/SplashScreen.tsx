import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkOnboardingStatus } from "@/services/onboardingService";
import { motion, AnimatePresence } from 'framer-motion';
// --- Ícones para os destaques ---
import { Sparkles, Bot, Gamepad2, Users } from 'lucide-react';
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

// --- Componente FlipWords (sem alterações) ---
const FlipWords = ({ words, duration = 3500 }: { words: string[], duration?: number }) => {
  const [currentWord, setCurrentWord] = useState(words[0]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const nextWordIndex = (words.indexOf(currentWord) + 1) % words.length;
      setCurrentWord(words[nextWordIndex]);
    }, duration);
    return () => clearTimeout(timeoutId);
  }, [currentWord, words, duration]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentWord}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40, filter: "blur(8px)", scale: 1.5, position: "absolute" }}
        transition={{ type: "spring", stiffness: 100, damping: 10 }}
        className="z-10 inline-block relative text-center px-2"
      >
        {currentWord.split("").map((letter, letterIndex) => (
          <motion.span
            key={currentWord + letterIndex}
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: letterIndex * 0.08, duration: 0.4 }}
            className="inline-block text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent drop-shadow-lg"
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};


const SplashScreen = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // ... (lógica de autenticação sem alterações)
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const onboardingCompleted = await checkOnboardingStatus(session.user.id);
        if (onboardingCompleted) {
          navigate("/inicio", { replace: true });
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleStart = () => {
    // ... (lógica do clique sem alterações)
    setFadeOut(true);
    setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const onboardingCompleted = await checkOnboardingStatus(session.user.id);
        navigate(onboardingCompleted ? "/inicio" : "/onboarding");
      } else {
        navigate("/login");
      }
    }, 500);
  };

  const words = ["autoconfiança", "realização", "propósito", "clareza"];

  // Array para os destaques, facilitando a renderização
  const features = [
    { icon: Bot, text: "Trilha com IA" },
    { icon: Gamepad2, text: "Jornada Gamificada" },
    { icon: Users, text: "+10 mil pessoas evoluindo" },
  ];

  // Variantes para a animação escalonada dos destaques
  const featuresContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 1.3, // Inicia após o botão aparecer
        staggerChildren: 0.2,
      },
    },
  };

  const featureItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex items-center justify-center font-nunito">
      {/* Efeitos de fundo (sem alterações) */}
      <div className="absolute inset-0 z-0 opacity-50 dark:opacity-30">
        <div className="absolute top-0 -left-1/4 w-96 h-96 sm:w-[32rem] sm:h-[32rem] bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-96 h-96 sm:w-[32rem] sm:h-[32rem] bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div className="absolute inset-0 z-0 animated-gradient-bg"></div>

      <div className={`relative z-10 flex flex-col items-center justify-center p-4 w-full h-full transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex-grow flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
          {/* Logo */}
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }} className="w-40 h-40 sm:w-52 sm:h-40">
            <img src="https://i.imgur.com/sxJhyH8.gif" alt="Logo Tryla" className="w-full h-auto" />
          </motion.div>
          {/* Frase de Impacto */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-1">
            <h1 className="text-3xl md:text-4xl font-light text-foreground/80 leading-tight">
              Desperte sua melhor versão com
            </h1>
          </motion.div>
          {/* FlipWords */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7, type: "spring", stiffness: 100 }} className="mb-4 h-20 flex justify-center items-center">
            <FlipWords words={words} />
          </motion.div>
          {/* Descrição */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-muted-foreground text-base sm:text-lg max-w-md mb-10">
            Sua jornada de autoconhecimento e desenvolvimento pessoal começa agora.
          </motion.p>
          {/* Botão de Ação (CTA) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
            <HoverBorderGradient onClick={handleStart} containerClassName="rounded-full" className="font-bold text-lg sm:text-xl px-6 py-3">
              <span className="flex items-center gap-4">
                <Sparkles className="w-6 h-6" />
                Começar minha jornada
              </span>
            </HoverBorderGradient>
          </motion.div>
        </div>

        {/* ==================================================================== */}
        {/* ================ NOVA SEÇÃO DE DESTAQUES/FUNCIONALIDADES ================ */}
        {/* ==================================================================== */}
        <motion.div
          className="w-full flex-shrink-0 pb-8 pt-10" // Padding para dar espaço
          variants={featuresContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                className="flex items-center"
                variants={featureItemVariants}
              >
                <div className="flex items-center gap-2">
                  <feature.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">{feature.text}</span>
                </div>
                {/* Adiciona um separador, exceto no último item em telas maiores */}
                {index < features.length - 1 && (
                   <span className="hidden sm:inline-block mx-4 text-muted-foreground/30">|</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SplashScreen;