import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getProfile, Profile } from '@/services/profileService';
import { BrainCircuit, BookOpen, Timer, MessageCircle, ArrowRight } from 'lucide-react';

// Componentes do seu projeto
import { Skeleton } from '@/components/ui/skeleton';
import BottomNavigation from '@/components/BottomNavigation';

// --- INTERFACES ---
interface ToolTheme {
  bgColor: string;
  textColor: string;
  iconBg?: string;
  iconColor?: string;
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

// --- ESTRUTURA DE DADOS DAS FERRAMENTAS ---
const tools: Tool[] = [
  { 
    path: '/teste-vocacional', 
    icon: BrainCircuit, 
    title: 'Oráculo Vocacional', 
    description: 'Descubra seus superpoderes profissionais. Spoiler: você é incrível!', 
    theme: {
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-900',
      iconBg: 'bg-orange-500',
      buttonText: 'Começar Missão',
    },
    featured: true,
  },
  { 
    path: '/tutor', 
    icon: MessageCircle, 
    title: 'IAê, o Gênio', 
    description: 'Seu tutor particular que nunca dorme e sabe (quase) tudo.', 
    theme: {
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-800',
      iconColor: 'text-orange-500'
    }
  },
  { 
    path: '/diario', 
    icon: BookOpen, 
    title: 'Diário de Bordo', 
    description: 'Onde suas ideias brilhantes e desabafos encontram um lar.', 
    theme: {
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-800',
      iconColor: 'text-orange-500'
    }
  },
  { 
    path: '/lab/pomodoro', 
    icon: Timer, 
    title: 'Modo Foco', 
    description: 'Concentre-se como um ninja e derrote a procrastinação.', 
    theme: {
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-800',
      iconColor: 'text-orange-500'
    }
  },
];

// --- COMPONENTE DE SKELETON ---
const LabPageSkeleton = () => (
  <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
    <header className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 bg-slate-200" />
        <Skeleton className="h-5 w-72 bg-slate-200" />
      </div>
      <Skeleton className="h-14 w-14 rounded-full bg-slate-200" />
    </header>
    <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
      <Skeleton className="lg:col-span-2 h-48 rounded-2xl bg-slate-200" />
      <Skeleton className="h-28 rounded-2xl bg-slate-200" />
      <Skeleton className="h-28 rounded-2xl bg-slate-200" />
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
    <div className={`flex-shrink-0 w-24 h-24 rounded-2xl flex items-center justify-center ${tool.theme.iconBg}`}>
      <tool.icon className="w-12 h-12 text-white" aria-hidden="true" />
    </div>
    <div className="flex-grow">
      <h2 className={`text-2xl font-bold ${tool.theme.textColor}`}>{tool.title}</h2>
      <p className="mt-1 text-slate-600 max-w-lg">{tool.description}</p>
    </div>
    <div className="mt-4 md:mt-0 ml-auto flex-shrink-0">
      <div className="flex items-center gap-2 font-semibold text-orange-600 transition-transform duration-300 group-hover:translate-x-1">
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
    <div className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center bg-white border">
      <tool.icon className={`w-8 h-8 ${tool.theme.iconColor}`} strokeWidth={2.5} aria-hidden="true" />
    </div>
    <div className="flex-grow">
      <h3 className={`text-lg font-bold ${tool.theme.textColor}`}>{tool.title}</h3>
      <p className="text-slate-500 text-sm">{tool.description}</p>
    </div>
  </Link>
);

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function LabPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca do perfil do usuário
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw new Error('Erro de autenticação');
        }
        
        if (user) {
          const userProfile = await getProfile(user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil para o Lab:", error);
        setError('Erro ao carregar perfil. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Separação das ferramentas
  const featuredTool = tools.find(tool => tool.featured);
  const secondaryTools = tools.filter(tool => !tool.featured);

  // Renderização condicional para loading
  if (isLoading) {
    return <LabPageSkeleton />;
  }

  // Renderização condicional para erro
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Ops! Algo deu errado
          </h2>
          <p className="text-slate-600 mb-4">
            {error || 'Não foi possível carregar seu perfil.'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white"> 
      <header className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Oficina de Ferramentas
            </h1>
            <p className="text-slate-500 mt-1">
              Seu arsenal secreto para conquistar o mundo.
            </p>
          </div>
          <Link to="/perfil" aria-label="Ir para perfil">
            <img
              src={profile.avatar_url || '/default-avatar.png'}
              alt="Foto do perfil"
              className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-md transition-transform hover:scale-110"
              onError={(e) => {
                e.currentTarget.src = '/default-avatar.png';
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
      
      {/* Espaçamento para a navegação inferior */}
      <div className="h-24" />
      <BottomNavigation />
    </div>
  );
}