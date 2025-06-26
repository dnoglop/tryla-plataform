// ARQUIVO: src/pages/ModulesPage.tsx (VERSÃO FINAL COM HEADER PRETO CORRIGIDO)

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getModuleProgress, isModuleCompleted, Module as BaseModule } from "@/services/moduleService";
import { getProfile } from "@/services/profileService";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle2, Star, Target, Bell, ArrowRight, Flame, Trophy, Users, Rocket } from "lucide-react";

import { cn } from "@/lib/utils";
import BottomNavigation from "@/components/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";

// --- INTERFACES, NÍVEIS E DADOS MOCADOS ---
interface Module extends BaseModule {
  subtitle?: string; level?: string; tags?: string[];
  phases?: { id: number; duration: number | null }[];
  total_lessons?: number; total_duration?: number; total_xp?: number;
}
type Hero = { id: number | string; name: string; designation: string; image: string; };
const mockHeroes: Hero[] = [
  { id: 1, name: "Lucas M.", designation: "Nível 5", image: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: 2, name: "Juliana S.", designation: "Nível 7", image: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: 3, name: "Fernanda C.", designation: "Nível 4", image: "https://randomuser.me/api/portraits/women/68.jpg" },
];
const LEVELS = [
  { name: "Semente", minXp: 0 }, { name: "Eco", minXp: 100 }, { name: "Pulso", minXp: 200 },
  { name: "Chave", minXp: 300 }, { name: "Rastro", minXp: 400 }, { name: "Brilho", minXp: 500 },
  { name: "Voo", minXp: 600 }, { name: "Passo", minXp: 700 },
];
const calculateLevelInfo = (xp: number) => {
  if (typeof xp !== "number" || xp < 0) xp = 0;
  const currentLevel = [...LEVELS].reverse().find((level) => xp >= level.minXp) || LEVELS[0];
  return currentLevel;
};

// --- COMPONENTES DE SKELETON ---
const ModulesPageSkeleton = () => (
    <div className="pb-24 min-h-screen bg-background animate-pulse p-4 sm:p-6 space-y-8">
        <Skeleton className="h-40 rounded-3xl bg-muted" />
        <Skeleton className="h-[400px] w-full rounded-3xl bg-muted" />
        <Skeleton className="h-40 w-full rounded-3xl bg-muted" />
    </div>
);

// --- COMPONENTES DA PÁGINA ---

// HEADER REFEITO COM FUNDO PRETO E LAYOUT CORRETO
const ModulesHeader = ({ profile, levelInfo }) => (
    <motion.div
        variants={{ hidden: { y: -20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
        className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-6 text-white relative overflow-hidden"
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="relative z-10 flex items-center justify-between">
            {/* Coluna da Esquerda: Foto e Textos */}
            <div className="flex items-center gap-4">
                <Link to="/perfil">
                    <img
                        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name?.split(" ")[0] || "A"}`}
                        alt="Avatar"
                        className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                    />
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-white">Suas Trilhas</h1>
                    {levelInfo && (
                        <p className="text-white/70">
                            Nível {levelInfo.name}, continue evoluindo!
                        </p>
                    )}
                </div>
            </div>

            {/* Coluna da Direita: Total de XP */}
            <div className="flex items-center gap-2 bg-white/10 p-2 pr-4 rounded-full">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-sm">{profile?.xp || 0}</span>
            </div>
        </div>
    </motion.div>
);

const FeaturedModuleCard = ({ module, progress }: { module: Module; progress: number; }) => {
  const navigate = useNavigate();
  const [isLaunching, setIsLaunching] = useState(false);
  const handleLaunch = async () => {
    if (isLaunching) return;
    setIsLaunching(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    navigate(`/modulo/${module.id}`);
  };
  return (
    <div className="relative bg-card rounded-3xl p-6 border-2 border-border overflow-hidden">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-y-2">
        <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium flex items-center gap-2"><Target className="w-4 h-4" /> SUA PRÓXIMA MISSÃO</span>
        <div className="flex items-center"><AnimatedTooltip items={mockHeroes} imageSize={8} /></div>
      </div>
      <div className="my-6 space-y-2">
        <h3 className="text-3xl font-extrabold text-foreground">{module.name}</h3>
        <div className="flex flex-wrap gap-2 pt-1">{module.tags?.map((tag) => (<span key={tag} className="text-xs font-semibold text-muted-foreground border px-2 py-0.5 rounded-full">{tag}</span>))}</div>
      </div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium text-muted-foreground">Progresso</span><span className="text-sm font-bold text-primary">{Math.round(progress)}%</span></div>
        <div className="w-full bg-muted rounded-full h-2.5"><motion.div className="essencia-valor h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "easeOut" }} /></div>
      </div>
      <motion.button className="w-full btn-saga-primario py-4 text-base font-bold flex items-center justify-center gap-2" onClick={handleLaunch} disabled={isLaunching}>
        <AnimatePresence mode="wait">
          {isLaunching ? (
            <motion.span key="loading" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center justify-center gap-2"><Rocket className="w-5 h-5 animate-pulse" /> Preparando para decolar...</motion.span>
          ) : (
            <motion.span key="ready" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center justify-center gap-2">Continuar Jornada <ArrowRight className="w-4 h-4" /></motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

const WeeklyChallengeCard = () => (
  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
    <div className="relative z-10">
      <div className="flex items-center space-x-2 mb-3"><Flame className="w-5 h-5" />
        <h3 className="font-semibold">Desafio da Semana</h3>
      </div>
      <p className="text-purple-100 text-sm mb-4">Complete 3 lições esta semana e ganhe um bônus especial de 100 XP!</p>
      <motion.button className="w-full bg-white text-purple-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Trophy className="w-5 h-5" /><span>Ver Desafio</span>
      </motion.button>
    </div>
  </div>
);

const ModuleListItem = ({ module }: { module: Module }) => {
  const navigate = useNavigate();
  const completedBy = Math.floor(20 + Math.random() * 80);
  return (
    <motion.div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-5 border border-green-200 dark:border-green-800 cursor-pointer" whileHover={{ scale: 1.01 }} onClick={() => navigate(`/modulo/${module.id}`)}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-6 h-6 text-white" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {module.level && <span className="text-xs font-bold text-green-800 dark:text-green-300">{module.level} |</span>}
            {module.tags?.map((tag) => <span key={tag} className="text-xs font-semibold text-green-800 dark:text-green-300">· {tag}</span>)}
          </div>
          <h4 className="font-bold text-foreground text-base">{module.name}</h4>
          <p className="text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5 mt-1"><Users size={12} /> +{completedBy} heróis concluíram</p>
        </div>
      </div>
    </motion.div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function ModulesPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["modulesPageDataV6"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado.");
            const [userProfile, userTrackResult] = await Promise.all([ getProfile(user.id), supabase.from("user_tracks").select("module_ids").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(), ]);
            const userTrack = userTrackResult?.data;
            let modulesResponse;
            if (userTrack && userTrack.module_ids?.length > 0) {
                modulesResponse = await supabase.from("modules").select("*, phases(id, duration)").in("id", userTrack.module_ids);
            } else {
                modulesResponse = await supabase.from("modules").select("*, phases(id, duration)");
            }
            if (modulesResponse.error) throw modulesResponse.error;
            let modules: Module[] = (modulesResponse.data || []).map((m) => {
                const total_lessons = m.phases.length;
                const total_duration = m.phases.reduce((sum, p) => sum + (p.duration || 0), 0);
                const total_xp = 5 * total_lessons + 20;
                return { ...m, total_lessons, total_duration, total_xp };
            });
            if (userTrack && userTrack.module_ids?.length > 0) {
                modules = userTrack.module_ids.map((id) => modules.find((m) => m.id === id)).filter(Boolean) as Module[];
            }
            const progressPromises = modules.map((m) => getModuleProgress(user.id, m.id));
            const completedPromises = modules.map((m) => isModuleCompleted(user.id, m.id));
            const [progressResults, completedResults] = await Promise.all([Promise.all(progressPromises), Promise.all(completedPromises)]);
            const progressData: { [key: number]: number } = {};
            const completedData: { [key: number]: boolean } = {};
            modules.forEach((module, index) => {
                progressData[module.id] = progressResults[index];
                completedData[module.id] = completedResults[index];
            });
            return { userProfile, modules, progressData, completedData };
        },
    });

    if (isLoading || !data) return <ModulesPageSkeleton />;

    const { userProfile, modules = [], progressData = {}, completedData = {} } = data;
    const levelInfo = userProfile?.xp !== undefined ? calculateLevelInfo(userProfile.xp) : null;
    const nextModule = modules.find((m) => !completedData[m.id]);
    const completedModulesList = modules.filter((m) => completedData[m.id]);

    return (
        <div className="relative min-h-screen pb-20 bg-background font-nunito">
            <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-8">

                <ModulesHeader profile={userProfile} levelInfo={levelInfo} />

                {nextModule ? (
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <FeaturedModuleCard module={nextModule} progress={progressData[nextModule.id] || 0} />
                    </motion.section>
                ) : (
                    <div className="text-center py-10 bg-card rounded-2xl"><h3 className="text-lg font-bold">Jornada Concluída!</h3><p className="text-muted-foreground mt-2">Parabéns! Novas aventuras em breve.</p></div>
                )}

                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <WeeklyChallengeCard />
                </motion.section>

                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h3 className="text-xl font-bold text-foreground mb-4">Reinos Conquistados</h3>
                    <div className="space-y-3">
                        {completedModulesList.length > 0 ? (
                            completedModulesList.map((module) => <ModuleListItem key={module.id} module={module} />)
                        ) : (
                            <div className="text-center py-10 bg-card rounded-2xl"><p className="text-muted-foreground">Você ainda não concluiu nenhum Reino.</p></div>
                        )}
                    </div>
                </motion.section>
            </div>
            <BottomNavigation />
        </div>
    );
}