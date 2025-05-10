
import React, { useState, useEffect, useRef } from "react";
import { Mail, Linkedin, Users, Target, Rocket, Book, ChevronRight, Edit, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, updateProfile, Profile } from "@/services/profileService";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { getModules, getPhasesByModuleId, isModuleCompleted } from "@/services/moduleService";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completedModulesCount, setCompletedModulesCount] = useState(0);
  const [totalModulesCount, setTotalModulesCount] = useState(0);
  const [completedPhasesCount, setCompletedPhasesCount] = useState(0);
  const [totalPhasesCount, setTotalPhasesCount] = useState(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const session = await supabase.auth.getSession();
        
        if (session?.data?.session?.user?.id) {
          const userId = session.data.session.user.id;
          const userProfile = await getProfile(userId);
          
          if (userProfile) {
            setProfile(userProfile);
            
            // After setting the profile, fetch achievement data
            fetchAchievementData(userId);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Não foi possível carregar seu perfil");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);
  
  const fetchAchievementData = async (userId: string) => {
    try {
      // Get all modules
      const modules = await getModules();
      setTotalModulesCount(modules.length);
      
      // Count completed modules
      let completed = 0;
      let totalPhases = 0;
      let completedPhases = 0;
      
      for (const module of modules) {
        const isCompleted = await isModuleCompleted(userId, module.id);
        if (isCompleted) {
          completed++;
        }
        
        // Get phases for each module
        const phases = await getPhasesByModuleId(module.id);
        totalPhases += phases.length;
        
        // Count completed phases
        if (phases.length > 0) {
          const { data } = await supabase
            .from('user_phases')
            .select('phase_id')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .in('phase_id', phases.map(p => p.id));
            
          if (data) {
            completedPhases += data.length;
          }
        }
      }
      
      setCompletedModulesCount(completed);
      setTotalPhasesCount(totalPhases);
      setCompletedPhasesCount(completedPhases);
      
    } catch (error) {
      console.error("Error fetching achievement data:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Redirect will be handled by auth listeners in App.tsx
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Falha ao sair da conta");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E36322] border-t-transparent"></div>
      </div>
    );
  }

  const level = profile?.level || 1;
  const nextLevel = level + 1;
  const currentXp = profile?.xp || 0;
  const maxXp = level * 100;
  const xpProgress = (currentXp / maxXp) * 100;
  const streakDays = profile?.streak_days || 0;

  const modulesProgress = totalModulesCount > 0 
    ? Math.round((completedModulesCount / totalModulesCount) * 100) 
    : 0;
    
  const phasesProgress = totalPhasesCount > 0 
    ? Math.round((completedPhasesCount / totalPhasesCount) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-white pb-16">
      <Header 
        title="Perfil" 
        rightContent={
          <Button variant="ghost" size="sm" className="rounded-full p-2" onClick={() => navigate("/editar-perfil")}>
            <Edit className="h-5 w-5 text-[#E36322]" />
          </Button>
        }
      />

      {/* Main profile section */}
      <div className="bg-[#E36322] px-4 pt-6 pb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Foto de perfil" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-3xl">
                  👤
                </div>
              )}
            </div>
            {profile?.streak_days && profile.streak_days > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-white text-[#E36322] rounded-full h-7 w-7 flex items-center justify-center border-2 border-[#E36322] text-xs font-bold">
                {profile.streak_days}🔥
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{profile?.full_name || "Usuário"}</h2>
            <p className="text-white/90">@{profile?.username || "username"}</p>
            <div className="flex items-center mt-1 text-white/80 text-xs">
              <Mail className="h-3 w-3 mr-1" />
              <span>Tryla desde {new Date(profile?.created_at || Date.now()).toLocaleDateString('pt-BR', {month: 'short', year: 'numeric'})}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-white">
          <div className="flex justify-between text-xs mb-1">
            <span>Nível {level}</span>
            <span>{currentXp}/{maxXp} XP</span>
          </div>
          <div className="relative h-2 w-full bg-white/30 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-white rounded-full" 
              style={{ width: `${xpProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-end text-xs mt-1">
            <span>Nível {nextLevel}</span>
          </div>
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="px-4 py-4 grid grid-cols-3 gap-4 border-b">
        <div className="flex flex-col items-center">
          <p className="text-lg font-bold text-[#E36322]">{totalPhasesCount}</p>
          <p className="text-xs text-gray-600">Lições</p>
        </div>
        <div className="flex flex-col items-center border-l border-r border-gray-200 px-2">
          <p className="text-lg font-bold text-[#E36322]">{currentXp}</p>
          <p className="text-xs text-gray-600">XP Total</p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-lg font-bold text-[#E36322]">{streakDays}</p>
          <p className="text-xs text-gray-600">Dias Seguidos</p>
        </div>
      </div>

      <div className="px-4 py-5">
        {/* Bio Section */}
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2 text-black">Sobre mim</h3>
          <p className="text-gray-700">{profile?.bio || "Adicione uma biografia para se apresentar."}</p>
          
          {profile?.linkedin_url && (
            <div className="mt-3 flex items-center gap-2 text-[#E36322]">
              <Linkedin size={18} />
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </div>
          )}
        </div>
        
        {/* Link para o Diário de Aprendizado */}
        <Link to="/diario" className="flex justify-between items-center py-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#E36322]/10 flex items-center justify-center">
              <Book className="text-[#E36322]" />
            </div>
            <div>
              <h3 className="font-bold">Diário de Aprendizado</h3>
              <p className="text-sm text-gray-600">Registre insights e reflexões</p>
            </div>
          </div>
          <ChevronRight className="text-gray-400" />
        </Link>
        
        {/* Conquistas section */}
        <div className="border-t border-gray-200 py-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg text-black">Conquistas</h3>
            <span className="text-sm text-[#E36322]">Ver todas</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#E36322]/10 flex items-center justify-center mb-1">
                <Rocket className="text-[#E36322]" />
              </div>
              <p className="text-xs font-medium">Primeiro Passo</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#E36322]/10 flex items-center justify-center mb-1">
                <Users className="text-[#E36322]" />
              </div>
              <p className="text-xs font-medium">Explorador Social</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#E36322]/10 flex items-center justify-center mb-1">
                <Target className="text-[#E36322]" />
              </div>
              <p className="text-xs font-medium">Fera nos Quizzes</p>
            </div>
          </div>
        </div>
        
        {/* Progresso section */}
        <div className="border-t border-gray-200 py-4">
          <h3 className="font-bold text-lg mb-4 text-black">Progresso</h3>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Módulos Completos</span>
                <span className="text-sm font-medium text-[#E36322]">
                  {completedModulesCount}/{totalModulesCount}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-[#E36322] rounded-full" 
                  style={{ width: `${modulesProgress}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Fases Completas</span>
                <span className="text-sm font-medium text-[#E36322]">
                  {completedPhasesCount}/{totalPhasesCount}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-[#E36322] rounded-full" 
                  style={{ width: `${phasesProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Settings and logout */}
        <div className="border-t border-gray-200 pt-6 pb-4">
          <Button 
            variant="outline" 
            className="w-full justify-between text-black border-gray-300 hover:bg-gray-100 hover:text-black" 
            onClick={handleSignOut}
          >
            <span>Sair da conta</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
