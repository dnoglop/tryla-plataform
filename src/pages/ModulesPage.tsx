import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Star,
  Target,
  ArrowRight,
  Flame,
  Trophy,
  Users,
  Rocket,
} from "lucide-react";

// Imports dos seus services
import {
  getModuleProgress,
  isModuleCompleted,
  Module as BaseModule,
} from "@/services/moduleService";
import { getProfile, Profile } from "@/services/profileService";
import { getLevels, Level } from "@/services/levelService"; // <-- Importamos o novo service de níveis

// Imports dos seus componentes de UI
import { cn } from "@/lib/utils";
import BottomNavigation from "@/components/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";

// --- INTERFACES, NÍVEIS E DADOS MOCADOS ---

// Interface estendida para os Módulos nesta página
interface Module extends BaseModule {
  subtitle?: string;
  level?: string;
  tags?: string[];
  phases?: { id: number; duration: number | null }[];
  total_lessons?: number;
  total_duration?: number;
  total_xp?: number;
}

// Interface para o Tooltip Animado
type Hero = { id: number | string; name: string; designation: string; image: string; };

// Dados mocados para o tooltip (pode ser substituído por dados reais no futuro)
const mockHeroes: Hero[] = [
  { id: 1, name: "Lucas M.", designation: "Nível 5", image: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: 2, name: "Juliana S.", designation: "Nível 7", image: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: 3, name: "Fernanda C.", designation: "Nível 4", image: "https://randomuser.me/api/portraits/women/68.jpg" },
];

// Função helper para calcular o nível do usuário, agora recebendo os níveis como parâmetro
const calculateLevelInfo = (xp: number, levels: Level[]) => {
    if (typeof xp !== "number" || xp < 0) xp = 0;
    if (!levels || levels.length === 0) return { name: "Semente", min_xp: 0 }; // Fallback seguro

    // A lógica agora usa 'min_xp' (snake_case) para corresponder ao banco de dados
    const currentLevel = [...levels].reverse().find((level) => xp >= level.min_xp) || levels[0];
    return currentLevel;
};


// --- COMPONENTES DE SKELETON (TELA DE CARREGAMENTO) ---
const ModulesPageSkeleton = () => (
    <div className="pb-24 min-h-screen bg-background animate-pulse p-4 sm:p-6 space-y-8">
        <Skeleton className="h-[116px] rounded-3xl bg-muted" />
        <Skeleton className="h-[300px] w-full rounded-3xl bg-muted" />
        <Skeleton className="h-40 w-full rounded-3xl bg-muted" />
    </div>
);


// --- SUB-COMPONENTES DA PÁGINA ---

// HEADER REFEITO COM DESIGN INSPIRADO NA INDEX, AGORA MAIS ELEGANTE
const ModulesHeader = ({ profile, levelInfo }: { profile: Profile | null; levelInfo: Level | null }) => (
    <motion.div
        variants={{ hidden: { y: -20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
        className="bg-gradient-to-br from-neutral-900 to-black rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl shadow-neutral-900/20"
    >
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-primary/5 rounded-full opacity-50"></div>
        <div className="relative z-10 flex items-center justify-between">
            {/* Coluna da Esquerda: Foto e Textos */}
            <div className="flex items-center gap-4">
                <Link to="/perfil" className="flex-shrink-0">
                    {/* FOTO CIRCULAR COM TAMANHO FIXO ABSOLUTO */}
                    <img
                        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name?.replace(/\s/g, "+")}&background=random`}
                        alt="Avatar do usuário"
                        className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full object-cover border-3 border-white/10 shadow-lg"
                        style={{ width: '56px', height: '56px' }}
                    />
                </Link>
                <div>
                    {/* O TÍTULO AGORA É PERSONALIZADO */}
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                        Sua trilha, <span className="text-primary">{profile?.full_name?.split(" ")[0]}!</span>
                    </h1>
                    {levelInfo && (
                        <p className="text-white/70 mt-1 text-sm">
                            Você é nível <span className="font-bold text-white">{levelInfo.name}</span>, continue evoluindo!
                        </p>
                    )}
                </div>
            </div>

            {/* Coluna da Direita: Total de XP em layout vertical */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1 bg-neutral-700/50 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Star className="w-4 h-4 text-black" />
                </div>
                <span className="font-bold text-white text-base leading-none">{profile?.xp || 0}</span>
                <span className="text-white/70 text-xs leading-none">XP</span>
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
    await new Promise((resolve) => setTimeout(resolve, 1200)); // Animação um pouco mais rápida
    navigate(`/modulo/${module.id}`);
  };

  return (
    <div className="relative bg-card rounded-3xl p-6 border-2 border-primary/20 shadow-lg shadow-primary/10 overflow-hidden">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-y-2">
        <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium flex items-center gap-2">
          <Target className="w-4 h-4" /> SUA PRÓXIMA MISSÃO
        </span>
        <div className="flex items-center">
          <AnimatedTooltip items={mockHeroes} imageSize={8} />
        </div>
      </div>
      <div className="my-6 space-y-2">
        <h3 className="text-3xl font-extrabold text-foreground">{module.name}</h3>
        <p className="text-muted-foreground">{module.description}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {module.tags?.map((tag) => (
            <span key={tag} className="text-xs font-semibold text-muted-foreground border px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">Sua evolução</span>
          <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <motion.div className="essencia-valor h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
        </div>
      </div>
      <motion.button className="w-full btn-saga-primario py-4 text-base font-bold flex items-center justify-center gap-2" onClick={handleLaunch} disabled={isLaunching}>
        <AnimatePresence mode="wait">
          {isLaunching ? (
            <motion.span key="loading" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center justify-center gap-2">
              <Rocket className="w-5 h-5 animate-pulse" /> Preparando sua decolagem...
            </motion.span>
          ) : (
            <motion.span key="ready" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center justify-center gap-2">
              Continuar a jornada <ArrowRight className="w-4 h-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

const WeeklyChallengeCard = () => (
  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
    <div className="relative z-10">
      <div className="flex items-center space-x-2 mb-3">
        <Flame className="w-5 h-5" />
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
    <motion.div className="bg-green-100 dark:bg-green-900/30 rounded-2xl p-5 border-2 border-green-200 dark:border-green-800/50 cursor-pointer" whileHover={{ y: -2, scale: 1.01, transition: { type: "spring", stiffness: 300 } }} onClick={() => navigate(`/modulo/${module.id}`)}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {module.level && <span className="text-xs font-bold text-green-800 dark:text-green-300 uppercase tracking-wider">{module.level}</span>}
          </div>
          <h4 className="font-bold text-foreground text-base">{module.name}</h4>
          <p className="text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5 mt-1">
            <Users size={12} /> +{completedBy} heróis concluíram
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-green-500 self-center" />
      </div>
    </motion.div>
  );
};


// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function ModulesPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["modulesPageDataWithLevels"], // Chave da query atualizada
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado.");

            // Adicionamos getLevels() para buscar os níveis dinamicamente
            const [userProfile, userTrackResult, levels] = await Promise.all([
                getProfile(user.id),
                supabase.from("user_tracks").select("module_ids").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
                getLevels(), // <-- BUSCANDO NÍVEIS DO BANCO
            ]);

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
                const total_xp = 5 * total_lessons + 15;
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

            // Retornamos os níveis junto com os outros dados
            return { userProfile, modules, progressData, completedData, levels };
        },
    });

    if (isLoading || !data) return <ModulesPageSkeleton />;

    const { userProfile, modules = [], progressData = {}, completedData = {}, levels = [] } = data;

    // Usamos os níveis dinâmicos para calcular a informação do nível atual
    const levelInfo = userProfile?.xp !== undefined ? calculateLevelInfo(userProfile.xp, levels) : null;

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
                    <div className="text-center py-10 bg-card rounded-2xl">
                        <h3 className="text-lg font-bold">Jornada Concluída!</h3>
                        <p className="text-muted-foreground mt-2">Parabéns! Novas aventuras em breve.</p>
                    </div>
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
                            <div className="text-center py-10 bg-card rounded-2xl">
                                <p className="text-muted-foreground">Você ainda não concluiu nenhum Reino.</p>
                            </div>
                        )}
                    </div>
                </motion.section>
            </div>
            <BottomNavigation />
        </div>
    );
}