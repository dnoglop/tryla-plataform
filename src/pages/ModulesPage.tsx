// ARQUIVO: src/pages/ModulesPage.tsx (VERSÃO COMPLETA E FINAL)

import { useState, useEffect } from "react";
import { Search, Map, ArrowRight, Award, Sparkles, BarChart2 } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { RealmPortalCard } from "@/components/journey/RealmPortalCard";
import { useQuery } from "@tanstack/react-query";
import { getModuleProgress, isModuleCompleted, Module } from "@/services/moduleService";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, Profile } from "@/services/profileService";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";

type Hero = {
  id: number | string;
  name: string;
  designation: string; // Podemos usar para mostrar o XP ou uma conquista
  image: string;
}

const mockHeroes: Hero[] = [
  {
    id: 1,
    name: "Lucas M.",
    designation: "Nível 5",
    image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
  },
  {
    id: 2,
    name: "Juliana S.",
    designation: "Nível 7",
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=150&q=80",
  },
  {
    id: 3,
    name: "Fernanda C.",
    designation: "Nível 4",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=150&q=80",
  },
  {
    id: 4,
    name: "Ricardo P.",
    designation: "Nível 6",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=150&q=80",
  },
];

// --- SKELETON (Componente completo para estado de carregamento) ---
const ModulesPageSkeleton = () => (
  <div className="pb-24 min-h-screen bg-background animate-pulse">
    <div className="container px-4 pt-8 pb-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-full bg-muted" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-muted" />
          <Skeleton className="h-4 w-32 bg-muted" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-full bg-muted" />
    </div>
    <div className="container px-4 py-2 space-y-8">
      <div className="lg:col-span-2 lg:row-span-2">
        <Skeleton className="h-96 w-full rounded-3xl bg-muted" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-48 rounded-3xl bg-muted" />
        <Skeleton className="h-48 rounded-3xl bg-muted" />
        <Skeleton className="h-48 rounded-3xl bg-muted" />
      </div>
    </div>
  </div>
);

// --- CARD DE DESTAQUE COM BORDA DINÂMICA ---
const FeaturedRealmCard = ({ module, progress }: { module: Module, progress: number }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => navigate(`/modulo/${module.id}`)}
      className="group card-gradient-reino p-6 flex flex-col gap-6 cursor-pointer h-full"
    >
      <div className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center bg-primary text-4xl transform transition-transform group-hover:scale-110">
        {module.emoji || "🎯"}
      </div>
      <div className="flex-grow">
        <p className="font-semibold text-primary">Seu próximo grande desafio</p>
        <h3 className="text-2xl font-bold text-foreground mt-1">{module.name}</h3>
        <p className="mt-2 text-muted-foreground max-w-lg">{module.description}</p>
      </div>
      <div className="mt-auto">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Exploração</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2 bg-primary/20 [&>*]:bg-primary" />
        <div className="mt-4 flex items-center gap-2 font-semibold text-primary transition-transform duration-300 group-hover:translate-x-1">
          Iniciar Desafio
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function ModulesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [communityStat, setCommunityStat] = useState<{ total: number; position: number } | null>(null);
  const [communityHeroes, setCommunityHeroes] = useState<Hero[]>([]);


  // --- LÓGICA DE DADOS COMPLETA (useQuery) ---
  const { data: initialData, isLoading } = useQuery({
    queryKey: ["modulesPageInitialData"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Protagonista não autenticado.");

      const [userProfile, userTrackResult] = await Promise.all([
        getProfile(user.id),
        supabase
          .from('user_tracks')
          .select('module_ids')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      const userTrack = userTrackResult?.data;
      let modules: Module[] = [];

      if (userTrack && userTrack.module_ids && userTrack.module_ids.length > 0) {
        const { data: trackModules, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .in('id', userTrack.module_ids);
        if (modulesError) throw modulesError;
        modules = userTrack.module_ids.map(id => trackModules.find(m => m.id === id)).filter(Boolean) as Module[];
      } else {
         const { data: allModules, error: allModulesError } = await supabase.from('modules').select('*');
         if (allModulesError) throw allModulesError;
         modules = allModules || [];
      }

      if (!modules || modules.length === 0) {
        return { userProfile, modules: [], progressData: {}, completedData: {} };
      }

      const progressPromises = modules.map((m) => getModuleProgress(user.id, m.id));
      const completedPromises = modules.map((m) => isModuleCompleted(user.id, m.id));
      const [progressResults, completedResults] = await Promise.all([
        Promise.all(progressPromises),
        Promise.all(completedPromises),
      ]);

      const progressData: { [key: number]: number } = {};
      const completedData: { [key: number]: boolean } = {};
      modules.forEach((module, index) => {
        progressData[module.id] = progressResults[index];
        completedData[module.id] = completedResults[index];
      });

      return { userProfile, modules, progressData, completedData };
    },
    retry: 1,
  });

  // Efeito para simular a busca de dados da comunidade
  useEffect(() => {
    if (initialData) {
      // LÓGICA SIMULADA: Em um app real, isso viria do backend.
      // Ex: `await getCommunityRankForModule(userId, nextModule.id)`
      const totalUsersInModule = 150 + Math.floor(Math.random() * 50); // Dado Falso Dinâmico
      const userRank = 22 + Math.floor(Math.random() * 10);      // Dado Falso Dinâmico
      setCommunityStat({ total: totalUsersInModule, position: userRank });
      setCommunityHeroes(mockHeroes);      // TODO: Substituir por uma chamada real: `await getHeroesInModule(nextModule.id)`
    }
  }, [initialData]);

  const profile = initialData?.userProfile;
  const modules = initialData?.modules || [];
  const moduleProgress = initialData?.progressData || {};
  const completedModules = initialData?.completedData || {};

  const isModuleLocked = (index: number): boolean => {
    if (index === 0) return false;
    const prevModuleId = modules[index - 1]?.id;
    if (prevModuleId === undefined) return true;
    return !completedModules[prevModuleId];
  };

  const nextModule = modules.find((module, index) => !isModuleLocked(index) && !completedModules[module.id]);

  const filteredModules = modules.filter(
    (module) => module.id !== nextModule?.id && module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Uma nova alvorada";
    if (hour < 18) return "A jornada continua";
    return "As estrelas te guiam";
  };

  if (isLoading) {
    return <ModulesPageSkeleton />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="relative min-h-screen pb-24 overflow-x-hidden animated-gradient-bg">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 z-20 bg-background/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-border/50"
      >
        <div className="container px-4 pt-6 pb-4 space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name?.split(" ")[0] || "A"}&background=random`}
              alt="Avatar da pessoa protagonista"
              className="h-14 w-14 rounded-full object-cover border-2 border-background shadow-md"
            />
            <div>
              <p className="text-sm text-muted-foreground">{getGreeting()},</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
                {profile?.full_name?.split(" ")[0] || "Protagonista"}!
              </h1>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar um Reino ou Desafio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card/50 border text-card-foreground placeholder:text-muted-foreground rounded-full py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </motion.header>

      <main className="container px-4 py-8 space-y-10 relative z-10">
        {!searchTerm && nextModule && (
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <motion.div 
              variants={itemVariants} 
              className="lg:col-span-2 lg:row-span-2 relative p-1 bg-gradient-to-br from-primary/50 via-primary/20 to-transparent rounded-[28px]"
            >
              <div className="h-full w-full bg-card rounded-[24px]">
                <FeaturedRealmCard
                  module={nextModule}
                  progress={moduleProgress[nextModule.id] || 0}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="card-jornada p-6 flex flex-col justify-center items-center text-center">
                <Award className="w-10 h-10 text-yellow-400 mb-3" />
                <p className="text-4xl font-bold text-foreground">
                    {Object.values(completedModules).filter(Boolean).length}
                </p>
                <p className="text-sm text-muted-foreground font-medium">Reinos Conquistados</p>
            </motion.div>

            <motion.div variants={itemVariants} className="card-jornada p-6 flex flex-col justify-center items-center text-center">
              <div className="flex flex-row items-center justify-center w-full">
                <AnimatedTooltip items={communityHeroes} />
              </div>
                <h3 className="font-bold text-foreground">Comunidade de Heróis</h3>
                {communityStat ? (
                    <p className="text-sm text-muted-foreground">
                        Você está entre os <span className="font-bold text-primary">{Math.round((communityStat.position / communityStat.total) * 100)}%</span> que alcançaram este Reino!
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground">Junte-se a outros heróis nesta jornada!</p>
                )}
            </motion.div>
          </motion.section>
        )}

        <section>
          <h2 className="font-bold text-xl text-foreground flex items-center gap-3 border-l-4 border-primary pl-3">
            <Map className="h-5 w-5 text-primary/80" />
            {searchTerm ? "Reinos Encontrados" : "Explore a sua jornada"}
          </h2>
          <div className="my-6" />
          {filteredModules.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
            >
              {filteredModules.map((module) => {
                  const originalIndex = modules.findIndex(m => m.id === module.id);
                  return (
                    <motion.div key={module.id} variants={itemVariants} className="h-full">
                      <RealmPortalCard
                        module={module}
                        progress={moduleProgress[module.id] || 0}
                        completed={completedModules[module.id] || false}
                        locked={isModuleLocked(originalIndex)}
                        onClick={() => navigate(`/modulo/${module.id}`)}
                      />
                    </motion.div>
                  );
                }
              )}
            </motion.div>
          ) : (
            <div className="text-center py-10 bg-card/50 rounded-2xl">
                <p className="text-muted-foreground">
                    {searchTerm ? "Nenhum Reino encontrado com esse nome." : "Você concluiu todos os reinos. Uma nova saga o aguarda em breve!"}
                </p>
            </div>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
};