
// src/pages/LabPage.tsx

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, Profile } from "@/services/profileService";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  BookOpen,
  Timer,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

// Componentes do seu projeto
import { Skeleton } from "@/components/ui/skeleton";
import BottomNavigation from "@/components/BottomNavigation";

// --- INTERFACES ---
interface ToolTheme {
  bgColor: string; // ex: 'bg-orange-50 dark:bg-primary/20'
  textColor: string;
  iconBg?: string; // ex: 'bg-primary'
  iconColor?: string; // ex: 'text-primary'
  buttonText?: string;
}

interface Tool {
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  theme: ToolTheme;
  featured?: boolean;
}

// --- MUDANÇA: ESTRUTURA DE DADOS COM CORES DE TEMA ---
const tools: Tool[] = [
  {
    path: "/teste-vocacional",
    icon: BrainCircuit,
    title: "Oráculo Vocacional",
    description:
      "Descubra seus superpoderes profissionais. Spoiler: você é incrível!",
    theme: {
      bgColor: "bg-primary/10 dark:bg-primary/20",
      textColor: "text-primary/90",
      iconBg: "bg-primary",
      buttonText: "Começar Missão",
    },
    featured: true,
  },
  {
    path: "/tutor",
    icon: MessageCircle,
    title: "IAê, o Gênio",
    description: "Seu tutor particular que nunca dorme e sabe (quase) tudo.",
    theme: {
      bgColor: "bg-card",
      textColor: "text-card-foreground",
      iconColor: "text-primary",
    },
  },
  {
    path: "/diario",
    icon: BookOpen,
    title: "Diário de Bordo",
    description: "Onde suas ideias brilhantes e desabafos encontram um lar.",
    theme: {
      bgColor: "bg-card",
      textColor: "text-card-foreground",
      iconColor: "text-primary",
    },
  },
  {
    path: "/pomodoro",
    icon: Timer,
    title: "Modo Foco",
    description: "Concentre-se como um ninja e derrote a procrastinação.",
    theme: {
      bgColor: "bg-card",
      textColor: "text-card-foreground",
      iconColor: "text-primary",
    },
  },
];

// --- COMPONENTE DE SKELETON ---
const LabPageSkeleton = () => (
  // MUDANÇA: Cores adaptadas para o tema
  <div className="bg-background min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
    <header className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 bg-muted" />
        <Skeleton className="h-5 w-72 bg-muted" />
      </div>
      <Skeleton className="h-14 w-14 rounded-full bg-muted" />
    </header>
    <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
      <Skeleton className="lg:col-span-2 h-48 rounded-2xl bg-muted" />
      <Skeleton className="h-28 rounded-2xl bg-muted" />
      <Skeleton className="h-28 rounded-2xl bg-muted" />
    </main>
  </div>
);

// --- COMPONENTE DA FERRAMENTA EM DESTAQUE ---
const FeaturedTool = ({ tool }: { tool: Tool }) => (
  <Link
    to={tool.path}
    className={`group lg:col-span-2 p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center gap-6 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${tool.theme.bgColor}`}
    aria-label={`Acessar ${tool.title}`}
  >
    <div
      className={`flex-shrink-0 w-24 h-24 rounded-2xl flex items-center justify-center ${tool.theme.iconBg}`}
    >
      <tool.icon
        className="w-12 h-12 text-primary-foreground"
        aria-hidden="true"
      />
    </div>
    <div className="flex-grow">
      <h2 className={`text-2xl font-bold ${tool.theme.textColor}`}>
        {tool.title}
      </h2>
      {/* MUDANÇA: Cor do texto de descrição */}
      <p className="mt-1 text-muted-foreground max-w-lg">{tool.description}</p>
    </div>
    <div className="mt-4 md:mt-0 ml-auto flex-shrink-0">
      <div className="flex items-center gap-2 font-semibold text-primary transition-transform duration-300 group-hover:translate-x-1">
        {tool.theme.buttonText}
        <ArrowRight className="w-5 h-5" aria-hidden="true" />
      </div>
    </div>
  </Link>
);

// --- COMPONENTE DE FERRAMENTA SECUNDÁRIA ---
const SecondaryTool = ({ tool }: { tool: Tool }) => (
  <Link
    to={tool.path}
    className={`group p-5 rounded-2xl shadow-md h-full flex items-center gap-5 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${tool.theme.bgColor}`}
    aria-label={`Acessar ${tool.title}`}
  >
    {/* MUDANÇA: Cor de fundo do ícone adaptada */}
    <div className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center bg-background border">
      <tool.icon
        className={`w-8 h-8 ${tool.theme.iconColor}`}
        strokeWidth={2.5}
        aria-hidden="true"
      />
    </div>
    <div className="flex-grow">
      <h3 className={`text-lg font-bold ${tool.theme.textColor}`}>
        {tool.title}
      </h3>
      <p className="text-muted-foreground text-sm">{tool.description}</p>
    </div>
  </Link>
);

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function LabPage() {
  // ... (lógica do componente permanece a mesma)
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw new Error("Erro de autenticação");
        if (user) setProfile(await getProfile(user.id));
      } catch (error) {
        console.error("Erro ao carregar perfil para o Lab:", error);
        setError("Erro ao carregar perfil. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const featuredTool = tools.find((tool) => tool.featured);
  const secondaryTools = tools.filter((tool) => !tool.featured);

  if (isLoading) {
    return <LabPageSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Ops! Algo deu errado
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "Não foi possível carregar seu perfil."}
          </p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    // MUDANÇA: Cor de fundo adaptada para o tema
    <div className="min-h-screen w-full bg-background">
      <header className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Oficina de Ferramentas
            </h1>
            <p className="text-muted-foreground mt-1">
              Seu arsenal secreto para conquistar o mundo.
            </p>
          </div>
          <Link to="/perfil" aria-label="Ir para perfil">
            <img
              src={profile.avatar_url || "/default-avatar.png"}
              alt="Foto do perfil"
              className="h-14 w-14 rounded-full object-cover border-2 border-background shadow-md transition-transform hover:scale-110"
              onError={(e) => {
                e.currentTarget.src = "/default-avatar.png";
              }}
            />
          </Link>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {featuredTool && <FeaturedTool tool={featuredTool} />}
          {secondaryTools.map((tool) => (
            <SecondaryTool key={tool.title} tool={tool} />
          ))}
        </div>
      </main>

      <div className="h-24" />
      <BottomNavigation />
    </div>
  );
}
