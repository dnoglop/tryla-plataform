import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/services/profileService";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";

// Componentes
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNavigation from "@/components/BottomNavigation";

// Ícones
import {
  BrainCircuit, BookOpen, Timer, MessageCircle, ArrowRight, Target,  Map, Heart, Shield, Sparkles, Lock, Crown, Gem,
} from "lucide-react";

// Mapa de ícones para renderização dinâmica
const iconMap: { [key: string]: React.ComponentType<any> } = {
  BrainCircuit, BookOpen, Timer, MessageCircle, Target, Heart, Map, Shield, Sparkles
};

// Interfaces atualizadas para corresponder ao banco de dados
interface Level {
  id: number;
  name: string;
  min_xp: number;
}

interface Tool {
  id: string;
  title: string;
  description: string;
  path: string;
  icon_name: string;
  unlock_level: number | null;
  coin_cost: number;
  is_featured: boolean;
}

interface ToolCategory {
  id: number;
  name: string;
  tools: Tool[];
}

// Função de cálculo de nível agora recebe os níveis dinamicamente
const calculateLevelInfo = (xp: number, levels: Level[]) => {
    if (!levels || levels.length === 0) return { level: { name: "...", id: 0 } };
    if (typeof xp !== 'number' || xp < 0) xp = 0;
    const currentLevel = [...levels].reverse().find(level => xp >= level.min_xp) || levels[0];
    return { level: currentLevel };
};

// Função para buscar todos os dados necessários da página
const fetchLabPageData = async (userId: string) => {
    const [profileData, levelsData, categoriesData, unlockedToolsData] = await Promise.all([
        supabase.from('profiles').select('*, coins').eq('id', userId).single(),
        supabase.from('levels').select('*').order('min_xp', { ascending: true }),
        supabase.from('tool_categories').select('*, tools(*)').order('order_index', { ascending: true }).order('order_index', { foreignTable: 'tools', ascending: true }),
        supabase.from('user_unlocked_tools').select('tool_id').eq('user_id', userId)
    ]);

    if (profileData.error) throw new Error(profileData.error.message);
    if (levelsData.error) throw new Error(levelsData.error.message);
    if (categoriesData.error) throw new Error(categoriesData.error.message);
    if (unlockedToolsData.error) throw new Error(unlockedToolsData.error.message);

    return {
        profile: profileData.data as Profile & { coins: number },
        levels: levelsData.data as Level[],
        toolCategories: categoriesData.data as ToolCategory[],
        unlockedToolIds: new Set(unlockedToolsData.data.map(t => t.tool_id))
    };
};

// --- COMPONENTES DA PÁGINA ---

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

const LabHeader = ({ profile, levels }: { profile: Profile & { coins: number }, levels: Level[] }) => {
    const levelInfo = calculateLevelInfo(profile.xp || 0, levels);
    return (
        <motion.div
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            className="bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-950 dark:to-neutral-900 m-0 mb-8 rounded-3xl p-6 text-white relative overflow-hidden"
        >
            <div className="flex items-center justify-between">
                {/* Grupo da Esquerda: Avatar, Título e agora o Nível */}
                <div className="flex items-center gap-4">
                    {/* <<< MUDANÇA AQUI >>> Removemos o div com 'relative' em volta da imagem */}
                    <img 
                        src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name?.replace(/\s/g, "+")}`} 
                        alt="Foto de perfil" 
                        className="w-16 h-16 rounded-full object-cover border-4 border-white/20 shadow-lg"
                    />

                    {/* Bloco de texto */}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Arsenal de Skills</h1>
                        <p className="text-white/70 text-sm mt-1">Ferramentas pra 'upar' suas habilidades.</p>

                        {/* <<< MUDANÇA AQUI >>> Novo elemento para mostrar o nível com ícone */}
                        <div className="flex items-center gap-2 mt-2">
                           <Crown className="w-4 h-4 text-primary" />
                           <span className="text-sm font-semibold text-white/90">
                               Nível {levelInfo.level.name}
                           </span>
                        </div>
                    </div>
                </div>

                {/* Grupo da Direita: Contador de Moedas (permanece igual) */}
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-full">
                    <Gem className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-white text-lg">{profile.coins || 0}</span>
                </div>
            </div>
        </motion.div>
    );
};

const PurchaseToolModal = ({ tool, isOpen, onClose, userCoins, onConfirmPurchase, isPurchasing }) => {
    if (!tool) return null;

    const hasEnoughCoins = userCoins >= tool.coin_cost;

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-card p-6 rounded-2xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out border">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/10 mb-4">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <Dialog.Title className="text-2xl font-bold text-card-foreground">{tool.title}</Dialog.Title>
                        <Dialog.Description className="text-muted-foreground mt-2 mb-6">{tool.description}</Dialog.Description>

                        <div className="w-full bg-muted p-4 rounded-lg mb-6">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-muted-foreground">Custo:</span>
                                <div className="flex items-center gap-2 font-bold text-primary">
                                    <Gem className="w-5 h-5"/>
                                    <span>{tool.coin_cost}</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => onConfirmPurchase(tool)}
                            disabled={!hasEnoughCoins || isPurchasing}
                            className="w-full btn-saga-primario py-3 text-base"
                        >
                            {isPurchasing ? "Desbloqueando..." :
                             !hasEnoughCoins ? "Cristais insuficientes" : `Desbloquear por ${tool.coin_cost} cristais`}
                        </Button>
                        <Button variant="ghost" onClick={onClose} className="w-full mt-2">
                            Agora não
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

const ToolCard = ({ tool, userLevel, isUnlocked, onCardClick }) => {
    const navigate = useNavigate();
    const ToolIcon = iconMap[tool.icon_name] || Lock;
    const isLockedByLevel = tool.unlock_level && userLevel < tool.unlock_level;
    const isPurchasable = tool.coin_cost > 0;

    const handleClick = () => {
        if (isUnlocked) {
            navigate(tool.path);
        } else {
            onCardClick(tool);
        }
    };

    const cardContent = (
        <>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-colors", isUnlocked ? "bg-primary/10" : "bg-muted")}>
                {isUnlocked ? <ToolIcon className="w-7 h-7 text-primary" /> : <Lock className="w-7 h-7 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-base truncate">{tool.title}</h3>
                {!isUnlocked && isLockedByLevel && (
                    <span className="text-xs text-primary font-semibold mt-1 block">
                        Nível {tool.unlock_level} necessário
                    </span>
                )}
                {!isUnlocked && !isLockedByLevel && isPurchasable && (
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold mt-1">
                        <Gem className="w-3 h-3"/> {tool.coin_cost} para desbloquear
                    </div>
                )}
            </div>
            {isUnlocked && <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />}
        </>
    );

    return (
        <motion.div
            onClick={handleClick}
            className={cn(
                "group bg-card border rounded-2xl p-4 flex items-center space-x-4 h-full shadow-sm transition-all cursor-pointer",
                isUnlocked ? "hover:shadow-lg hover:border-primary/50" : "opacity-80 hover:bg-muted"
            )}
            whileHover={{ y: -4 }}
        >
            {cardContent}
        </motion.div>
    );
};

const FeaturedToolCard = ({ tool, isUnlocked, onCardClick }) => {
    const ToolIcon = iconMap[tool.icon_name] || Sparkles;
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent) => {
        if (!isUnlocked) {
            e.preventDefault();
            onCardClick(tool);
        }
    };

    return (
        <Link to={isUnlocked ? tool.path : "#"} onClick={handleClick} className="group block">
            <motion.div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-3xl p-6 relative overflow-hidden border border-primary/20" whileHover={{ scale: 1.02, y: -5, transition: { type: 'spring', stiffness: 200 } }}>
                <Sparkles className="w-10 h-10 text-primary/30 absolute -top-2 -right-2" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="bg-primary rounded-2xl w-20 h-20 flex items-center justify-center flex-shrink-0"><ToolIcon className="w-10 h-10 text-primary-foreground" /></div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-extrabold text-foreground">{tool.title}</h2>
                        <p className="text-muted-foreground mt-1 max-w-md">{tool.description}</p>
                    </div>
                    <div className="bg-primary text-primary-foreground px-5 py-3 rounded-full font-semibold flex items-center gap-2 self-start sm:self-center mt-4 sm:mt-0 transition-transform group-hover:scale-105">
                        <span>{isUnlocked ? "Começar" : "Desbloquear"}</span>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default function LabPage() {
    const queryClient = useQueryClient();
    const [toolToBuy, setToolToBuy] = useState<Tool | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const { data: authUser } = useQuery({
        queryKey: ['user'],
        queryFn: async () => (await supabase.auth.getUser()).data.user
    });

    const { data, isLoading, error } = useQuery({
        queryKey: ["labPageData", authUser?.id],
        queryFn: () => fetchLabPageData(authUser!.id),
        enabled: !!authUser?.id
    });

    const handlePurchaseClick = (tool: Tool) => {
        setToolToBuy(tool);
    };

    const handleConfirmPurchase = async (tool: Tool) => {
        if (!data?.profile || !tool) return;
        if (data.profile.coins < tool.coin_cost) {
            console.error("Cristais insuficientes!");
            return;
        }

        setIsPurchasing(true);
        try {
            const { error: coinError } = await supabase.from('coin_history').insert({
                user_id: authUser!.id,
                amount: -tool.coin_cost,
                source: 'TOOL_PURCHASE',
                source_id: tool.id
            });
            if (coinError) throw coinError;

            const { error: unlockError } = await supabase.from('user_unlocked_tools').insert({
                user_id: authUser!.id,
                tool_id: tool.id,
                unlock_method: 'purchase'
            });
            if (unlockError) throw unlockError;

            queryClient.invalidateQueries({ queryKey: ["labPageData", authUser?.id] });
            setToolToBuy(null);

        } catch (err) {
            console.error("Erro ao comprar ferramenta:", err);
        } finally {
            setIsPurchasing(false);
        }
    };

    if (isLoading) return <LabPageSkeleton />;
    if (error || !data) return <div>Ocorreu um erro ao carregar os dados.</div>;

    const { profile, levels, toolCategories, unlockedToolIds } = data;
    const userLevel = calculateLevelInfo(profile.xp, levels).level.id;
    const featuredTool = toolCategories.flatMap(c => c.tools).find(t => t.is_featured);

    const isFeaturedToolUnlocked = featuredTool ? (
        (featuredTool.unlock_level ? userLevel >= featuredTool.unlock_level : false) ||
        unlockedToolIds.has(featuredTool.id) ||
        (!featuredTool.unlock_level && featuredTool.coin_cost === 0)
    ) : false;

    return (
        <div className="min-h-screen w-full bg-background font-nunito">
             <PurchaseToolModal
                isOpen={!!toolToBuy}
                onClose={() => setToolToBuy(null)}
                tool={toolToBuy}
                userCoins={profile.coins}
                onConfirmPurchase={handleConfirmPurchase}
                isPurchasing={isPurchasing}
            />

            <motion.div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8" initial="hidden" animate="visible">
                <LabHeader profile={profile} levels={levels}/>
                <main className="space-y-10">
                    {featuredTool && (
                        <motion.div>
                           <FeaturedToolCard
                                tool={featuredTool}
                                isUnlocked={isFeaturedToolUnlocked}
                                onCardClick={handlePurchaseClick}
                           />
                        </motion.div>
                    )}

                    {toolCategories.map((category) => (
                        <motion.div key={category.name} className="space-y-4">
                            <h2 className="text-xl font-bold text-foreground pl-1">{category.name}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {category.tools
                                    .filter(tool => !tool.is_featured)
                                    .map((tool) => {
                                        const isUnlockedByLevel = tool.unlock_level ? userLevel >= tool.unlock_level : false;
                                        const isUnlockedByPurchase = unlockedToolIds.has(tool.id);
                                        const isFree = !tool.unlock_level && tool.coin_cost === 0;
                                        const isEffectivelyUnlocked = isUnlockedByLevel || isUnlockedByPurchase || isFree;

                                        return (
                                            <ToolCard
                                                key={tool.id}
                                                tool={tool}
                                                userLevel={userLevel}
                                                isUnlocked={isEffectivelyUnlocked}
                                                onCardClick={handlePurchaseClick}
                                            />
                                        )
                                    })}
                            </div>
                        </motion.div>
                    ))}
                </main>
            </motion.div>
            <div className="h-20" />
            <BottomNavigation />
        </div>
    );
}