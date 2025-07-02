import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Coins, Home, Rocket, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getNextModule,
  getModuleDetailsForReward,
  grantModuleXpReward,
  recordCoinGain
} from "@/services/moduleService";

// --- TIPOS E CONSTANTES ---
type CelebrationStep = "initial" | "xp" | "coins" | "summary";

const CATCHY_TITLES = [
  "Você é uma Lenda!",
  "Missão Cumprida, Herói!",
  "Nível Mestre Atingido!",
  "Simplesmente Imparável!",
  "O Conhecimento é Seu!",
  "Mais um Reino Conquistado!",
];


// --- SUB-COMPONENTES E SKELETONS ---
const RewardCard = ({ icon, title, value, colorClass, onCollect, collected, isCollecting }) => (
    <div className="w-full max-w-sm mx-auto text-center">
        <motion.div
            className={cn("mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg", colorClass)}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
            {icon}
        </motion.div>
        <motion.h2
            className="text-2xl font-bold text-foreground mb-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.4 } }}
        >
            {title}
        </motion.h2>
        <motion.p
            className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-primary mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { delay: 0.6 } }}
        >
            +{value}
        </motion.p>
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { delay: 0.8 } }}
        >
            <Button
                onClick={onCollect}
                disabled={collected || isCollecting}
                size="lg"
                className={cn("w-full btn-saga-primario py-6 text-lg font-bold transition-all duration-300",
                    collected && "bg-green-500 hover:bg-green-600"
                )}
            >
                {isCollecting ? "Coletando..." : (collected ? (
                    <motion.span initial={{scale:0.8}} animate={{scale:1}} className="flex items-center justify-center gap-2">
                        <Check className="w-6 h-6" /> Coletado!
                    </motion.span>
                ) : "Coletar")}
            </Button>
        </motion.div>
    </div>
);

const ModuleCompleteSkeleton = () => (
    <div className="h-screen w-full bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4 animate-pulse">
            <Skeleton className="w-28 h-28 rounded-full mx-auto bg-muted" />
            <Skeleton className="h-8 w-3/4 mx-auto bg-muted" />
            <Skeleton className="h-6 w-1/2 mx-auto bg-muted" />
        </div>
    </div>
);


// --- COMPONENTE PRINCIPAL ---
export default function ModuleCompletePage() {
  const navigate = useNavigate();
  const { moduleId } = useParams<{ moduleId: string }>();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<CelebrationStep>("initial");
  const [xpCollected, setXpCollected] = useState(false);
  const [isCollectingXp, setIsCollectingXp] = useState(false);
  const [coinsCollected, setCoinsCollected] = useState(false);
  const [isCollectingCoins, setIsCollectingCoins] = useState(false);

  // 1. Busca os detalhes da recompensa (XP total e moedas)
  const { data: rewardDetails, isLoading: isLoadingRewards } = useQuery({
    queryKey: ["moduleRewardDetails", moduleId],
    queryFn: () => getModuleDetailsForReward(Number(moduleId)),
    enabled: !!moduleId,
    staleTime: Infinity,
  });

  // 2. Busca o próximo módulo para o botão de navegação
  const { data: nextModule } = useQuery({
    queryKey: ["nextModuleAfter", moduleId],
    queryFn: () => getNextModule(Number(moduleId)),
    enabled: !!moduleId,
  });

  useEffect(() => {
    if (rewardDetails) {
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 }, zIndex: 10 });
      setTimeout(() => setStep("xp"), 2500);
    }
  }, [rewardDetails]);

  const handleCollectXp = async () => {
    if (xpCollected || isCollectingXp || !rewardDetails) return;
    setIsCollectingXp(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado para coletar XP.");

      console.log("➡️ Enviando para grantModuleXpReward:", {
        userId: user.id,
        moduleId: Number(moduleId),
        totalXp: rewardDetails.totalXp,
      });

      // A chamada que pode estar falhando
      await grantModuleXpReward(user.id, Number(moduleId), rewardDetails.totalXp);

      console.log("✅ XP Coletado com sucesso!");
      setXpCollected(true);
      queryClient.invalidateQueries({ queryKey: ["userProfile", "dashboardData"] });
      setTimeout(() => setStep("coins"), 1200);

    } catch (error) {
      // Se um erro for lançado pelo service, ele será capturado aqui.
      console.error("Falha ao coletar XP:", error);
      // Podemos opcionalmente mostrar uma mensagem ao usuário com a biblioteca 'sonner'
      // toast.error("Ops! Não foi possível coletar o XP.");
    } finally {
      setIsCollectingXp(false);
    }
  };

  const handleCollectCoins = async () => {
    if (coinsCollected || isCollectingCoins || !rewardDetails) return;
    setIsCollectingCoins(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado para coletar moedas.");

      console.log("➡️ Enviando para recordCoinGain:", {
        userId: user.id,
        moduleId: Number(moduleId),
        coins: rewardDetails.coins,
      });

      // A chamada que pode estar falhando
      await recordCoinGain(user.id, rewardDetails.coins, Number(moduleId));

      console.log("✅ Moedas coletadas com sucesso!");
      setCoinsCollected(true);
      queryClient.invalidateQueries({ queryKey: ["userProfile", "dashboardData"] });
      setTimeout(() => setStep("summary"), 1200);

    } catch (error) {
      console.error("Falha ao coletar Moedas:", error);
      // toast.error("Ops! Não foi possível coletar as moedas.");
    } finally {
      setIsCollectingCoins(false);
    }
  };

  const randomTitle = CATCHY_TITLES[Math.floor(Math.random() * CATCHY_TITLES.length)];

  const stepVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -30, transition: { duration: 0.3, ease: "easeIn" } },
  };

  if (isLoadingRewards || !rewardDetails) {
    return <ModuleCompleteSkeleton />;
  }

  return (
    <div className="h-screen w-full bg-background font-nunito flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="w-full max-w-md mx-auto">
            <AnimatePresence mode="wait">
                {step === "initial" && (
                    <motion.div
                        key="initial"
                        variants={stepVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ delay: 0.2, duration: 0.7, type:"spring" }}
                            className="w-28 h-28 bg-gradient-to-br from-primary to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30"
                        >
                            <Trophy className="w-14 h-14 text-white" />
                        </motion.div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                            {randomTitle}
                        </h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Você concluiu o módulo <span className="font-bold text-foreground">{rewardDetails.moduleName || 'com sucesso'}!</span>
                        </p>
                    </motion.div>
                )}

                {step === "xp" && (
                    <motion.div key="xp" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                        <RewardCard
                            icon={<Star className="w-12 h-12 text-black" />}
                            title="XP Total do Módulo"
                            value={rewardDetails.totalXp}
                            colorClass="bg-primary"
                            onCollect={handleCollectXp}
                            collected={xpCollected}
                            isCollecting={isCollectingXp}
                        />
                    </motion.div>
                )}

                {step === "coins" && (
                    <motion.div key="coins" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                        <RewardCard
                            icon={<Coins className="w-12 h-12 text-amber-900" />}
                            title="Moedas do Módulo"
                            value={rewardDetails.coins}
                            colorClass="bg-amber-400"
                            onCollect={handleCollectCoins}
                            collected={coinsCollected}
                            isCollecting={isCollectingCoins}
                        />
                    </motion.div>
                )}

                {step === "summary" && (
                    <motion.div
                        key="summary"
                        variants={stepVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="text-center"
                    >
                         <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, duration: 0.5, type:"spring" }}
                            className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20"
                        >
                            <Rocket className="w-12 h-12 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold text-foreground">Sua jornada continua!</h2>
                        <p className="text-muted-foreground mt-2 mb-8">
                            O conhecimento é um foguete que não tem ré. Continue aprendendo e evoluindo sempre.
                        </p>
                        <div className="flex flex-col gap-4">
                            {nextModule && (
                                <Button
                                    onClick={() => navigate(`/modulo/${nextModule.id}`)}
                                    size="lg"
                                    className="w-full btn-saga-primario py-6 text-lg font-bold flex items-center justify-center gap-2"
                                >
                                    Próximo Módulo <ArrowRight className="w-5 h-5" />
                                </Button>
                            )}
                             <Button
                                onClick={() => navigate("/modulos")}
                                size="lg"
                                variant="outline"
                                className="w-full py-6 text-lg"
                            >
                                <Home className="w-5 h-5 mr-2" /> Ver todos os Módulos
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}