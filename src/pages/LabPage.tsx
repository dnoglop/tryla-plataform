// src/pages/LabPage.tsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, Profile } from "@/services/profileService";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Componentes
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNavigation from "@/components/BottomNavigation";

// Ícones
import {
  BrainCircuit, BookOpen, Timer, MessageCircle, ArrowRight, Target,
  CheckCircle2, Zap, Map, Heart, Coffee, Shield, Sparkles, Lock, Crown, Flame
} from "lucide-react";

// --- LÓGICA DE NÍVEIS (IMPORTANTE PARA O HEADER) ---
const LEVELS = [
    { name: 'Semente', minXp: 0 }, { name: 'Eco', minXp: 100 },
    { name: 'Pulso', minXp: 200 }, { name: 'Chave', minXp: 300 },
    // Adicione todos os seus níveis aqui...
];

const calculateLevelInfo = (xp: number) => {
    if (typeof xp !== 'number' || xp < 0) xp = 0;
    const currentLevel = [...LEVELS].reverse().find(level => xp >= level.minXp) || LEVELS[0];
    return { level: currentLevel };
};

// --- INTERFACES E TIPOS ---
interface Tool {
  id: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  locked?: boolean;
  unlockLevel?: number;
}

interface ToolCategory {
  name: string;
  tools: Tool[];
}

// --- ESTRUTURA DE DADOS DAS FERRAMENTAS ---
const toolCategories: ToolCategory[] = [
  {
    name: "Pra Começar: Se Liga em Você",
    tools: [
      { id: "meu-match-carreira", path: "/teste-vocacional", icon: BrainCircuit, title: "Meu Match de Carreira", description: "Descubra as profissões que dão 'match' com o seu perfil. Swipe right na sua futura carreira!" },
      { id: "meu-bloco-ideias", path: "/diario", icon: BookOpen, title: "Meu Bloco de Ideias", description: "Seu espaço seguro para anotar tudo: de ideias geniais a memes para não esquecer." },
      { id: "reset-mental", path: "/meditacao", icon: Heart, title: "Reset Mental", description: "Dê um 'reboot' no estresse e na ansiedade. Uma pausa rápida para recarregar a mente.", locked: true, unlockLevel: 2 },
    ],
  },
  {
    name: "Kit de Produtividade",
    tools: [
       { id: "timer-sprint", path: "/pomodoro", icon: Timer, title: "Timer de Sprint", description: "Use ciclos de produtividade para farmar XP e evitar o 'burnout'." },
       { id: "minhas-quests", path: "/metas", icon: CheckCircle2, title: "Minhas Quests", description: "Transforme seus objetivos em missões de video-game. Suba de nível na vida real!", locked: true, unlockLevel: 6 },
       { id: "modo-foco", path: "/modo-foco", icon: Zap, title: "Modo Foco (Hyperfocus)", description: "Ative o modo 'não perturbe' da vida real e detone suas tarefas sem distrações.", locked: true, unlockLevel: 7 },
       { id: "start-dia", path: "/ritual-matinal", icon: Coffee, title: "Start do Dia", description: "Aperte o 'start' da sua manhã com um ritual que te deixa pronto pra qualquer desafio.", locked: true, unlockLevel: 9 },
    ],
  },
  {
    name: "Level Up na Carreira",
    tools: [
      { id: "zap-futuro-ia", path: "/tutor", icon: MessageCircle, title: "Zap do Futuro (IA)", description: "Mande um 'zap' para nossa IA e tire qualquer dúvida sobre carreira, estudos e mais." },
      { id: "meu-roadmap-carreira", path: "/mapeador-carreira", icon: Map, title: "Meu Roadmap de Carreira", description: "Crie o mapa do seu futuro profissional, com os próximos passos e skills para desbloquear.", locked: true, unlockLevel: 3 },
      { id: "modo-treino-entrevista", path: "/simulador-entrevista", icon: Shield, title: "Modo Treino: Entrevista", description: "Encare o 'boss' da entrevista sem medo. Pratique aqui e chegue preparado.", locked: true, unlockLevel: 5 },
    ],
  },
];
const featuredToolId = 'meu-match-carreira';

// --- COMPONENTE DE SKELETON ---
const LabPageSkeleton = () => (
  <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse bg-background">
    <Skeleton className="h-40 rounded-3xl bg-muted" />
    <main className="space-y-8 pt-4">
      <Skeleton className="h-48 rounded-2xl bg-muted" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-48 bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl bg-muted" />
          <Skeleton className="h-32 rounded-xl bg-muted" />
          <Skeleton className="h-32 rounded-xl bg-muted" />
        </div>
      </div>
    </main>
  </div>
);

// --- COMPONENTE DO HEADER (NOVO) ---
const LabHeader = ({ profile }: { profile: Profile }) => {
    const levelInfo = calculateLevelInfo(profile.xp || 0);

    return (
        <motion.div
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } } }}
            className="bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-950 dark:to-neutral-900 m-0 mb-8 rounded-3xl p-6 text-white relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-12 -translate-x-12"></div>

            <div className="relative z-10 flex items-center space-x-4">
                <div className="relative flex-shrink-0">
                    <motion.img
                        src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name?.replace(/\s/g, "+")}&background=random`}
                        alt="Foto de perfil"
                        className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg"
                    />
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }}
                        className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-r from-primary to-orange-400 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg border-2 border-neutral-800">
                        {levelInfo.level.name.substring(0, 1)}
                    </motion.div>
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">Arsenal de Skills</h1>
                    <p className="text-white/70 text-sm mt-1">Ferramentas pra você 'upar' suas habilidades e destravar seu potencial.</p>
                </div>
            </div>
        </motion.div>
    );
};


// --- COMPONENTES DE CARD ---
const ToolCard = ({ tool, userLevel }: { tool: Tool, userLevel: number }) => {
  const isLocked = tool.locked && userLevel < (tool.unlockLevel || 999);
  const cardContent = (
    <>
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-colors", isLocked ? "bg-muted" : "bg-primary/10")}>
        {isLocked ? <Lock className="w-7 h-7 text-muted-foreground" /> : <tool.icon className="w-7 h-7 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground text-base truncate">{tool.title}</h3>
        <p className="text-muted-foreground text-sm leading-tight">{tool.description}</p>
        {isLocked && <span className="text-xs text-primary font-semibold mt-1 block">Desbloqueie no nível {tool.unlockLevel}</span>}
      </div>
      {!isLocked && <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />}
    </>
  );

  if (isLocked) {
    return <div className="bg-card border rounded-2xl p-4 flex items-center space-x-4 h-full opacity-70">{cardContent}</div>;
  }

  return (
    <Link to={tool.path} className="group">
      <motion.div className="bg-card border rounded-2xl p-4 flex items-center space-x-4 h-full shadow-sm hover:shadow-lg hover:border-primary/50 transition-all" whileHover={{ y: -4 }}>{cardContent}</motion.div>
    </Link>
  );
};

const FeaturedToolCard = ({ tool }: { tool: Tool }) => (
    <Link to={tool.path} className="group">
        <motion.div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-3xl p-6 relative overflow-hidden border border-primary/20" whileHover={{ scale: 1.02, y: -5, transition: { type: 'spring', stiffness: 200 } }}>
            <Sparkles className="w-10 h-10 text-primary/30 absolute -top-2 -right-2" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="bg-primary rounded-2xl w-20 h-20 flex items-center justify-center flex-shrink-0"><tool.icon className="w-10 h-10 text-primary-foreground" /></div>
                <div className="flex-1">
                    <h2 className="text-2xl font-extrabold text-foreground">{tool.title}</h2>
                    <p className="text-muted-foreground mt-1 max-w-md">{tool.description}</p>
                </div>
                <div className="bg-primary text-primary-foreground px-5 py-3 rounded-full font-semibold flex items-center gap-2 self-start sm:self-center mt-4 sm:mt-0 transition-transform group-hover:scale-105">
                    <span>Começar</span>
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </motion.div>
    </Link>
);


// --- COMPONENTE PRINCIPAL ---
export default function LabPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setProfile(await getProfile(user.id));
      } catch (error) { console.error("Erro ao carregar perfil para o Lab:", error); }
      finally { setIsLoading(false); }
    };
    fetchUserProfile();
  }, []);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } } };

  if (isLoading || !profile) {
    return <LabPageSkeleton />;
  }

  const userLevel = profile.level || 1;
  const featuredTool = toolCategories.flatMap(c => c.tools).find(t => t.id === featuredToolId);

  return (
    <div className="min-h-screen w-full bg-background font-nunito">
      <motion.div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8" variants={containerVariants} initial="hidden" animate="visible">

        {/* HEADER CORRIGIDO AQUI */}
        <LabHeader profile={profile} />

        <main className="space-y-10">
          {featuredTool && (
            <motion.div variants={itemVariants}>
              <FeaturedToolCard tool={featuredTool} />
            </motion.div>
          )}

          {toolCategories.map((category) => (
            <motion.div key={category.name} variants={itemVariants} className="space-y-4">
              <h2 className="text-xl font-bold text-foreground pl-1">{category.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.tools.filter(tool => tool.id !== featuredToolId).map((tool) => (
                    <ToolCard key={tool.id} tool={tool} userLevel={userLevel} />
                ))}
              </div>
            </motion.div>
          ))}
        </main>
      </motion.div>

      <div className="h-10" />
      <BottomNavigation />
    </div>
  );
}