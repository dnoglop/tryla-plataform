
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, BookOpen, ArrowRight, User, Bell } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from '@tanstack/react-query';
import { getModules, Module } from "@/services/moduleService";
import { getProfile } from "@/services/profileService";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardPage = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const userId = data.user.id;
          setUserId(userId);
          const userProfile = await getProfile(userId);
          
          if (userProfile) {
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seu perfil",
          variant: "destructive"
        });
      }
    };

    fetchUserProfile();
  }, [toast]);

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules,
    enabled: !!userId,
  });

  if (isLoading || !profile) {
    return (
      <div className="pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-[#E36322] px-4 pt-6 pb-4 rounded-b-3xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-white text-lg font-semibold">Hi, {profile.full_name?.split(' ')[0] || "Aluno"}</h2>
          </div>
          <Avatar className="h-10 w-10 border-2 border-white">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="Foto de perfil" />
            ) : (
              <AvatarFallback className="bg-white/20 text-white">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-2">
          <Input
            className="bg-white/10 border-0 text-white placeholder-white/60 rounded-full pl-10 pr-4 py-2"
            placeholder="Pesquisar"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
        </div>
      </div>

      <div className="container px-4 py-5 space-y-6">
        {/* What do you want to learn today */}
        <div>
          <Card className="overflow-hidden border-none shadow-md rounded-xl">
            <CardContent className="p-0">
              <div className="bg-blue-50 p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-base sm:text-lg text-gray-800">O que você gostaria de aprender hoje?</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">Continue sua jornada de aprendizado</p>
                  <Link 
                    to="/modulos"
                    className="bg-[#E36322] text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium inline-flex items-center"
                  >
                    Começar
                  </Link>
                </div>
                <div className="hidden sm:block">
                  <img 
                    src="/lovable-uploads/1686c74f-2645-4b35-95c0-da717ef37ffe.png" 
                    alt="Graduação" 
                    className="w-24 h-24 object-contain"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* For You Section */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Para você</h2>
            <Link to="/modulos" className="text-xs sm:text-sm font-medium text-[#E36322] flex items-center">
              Ver tudo
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PHP Card */}
            <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-xl">
              <CardContent className="p-0">
                <div className="bg-green-100 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-gray-800">Básico: O que é PHP?</h3>
                      <p className="text-xs text-gray-600 mt-1">PHP é uma linguagem de script do lado do servidor...</p>
                      <div className="mt-3 flex items-center gap-2">
                        <BookOpen className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-500">20 mins</span>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white text-xs">Básico</Badge>
                  </div>
                </div>
                <div className="p-3 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-[10px]">A</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-600">Artur</span>
                  </div>
                  <Link 
                    to="/modulos/php"
                    className="text-[#E36322] text-xs font-medium"
                  >
                    Ver mais
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Join your class card */}
            <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-xl">
              <CardContent className="p-4">
                <h3 className="font-bold text-base text-gray-800">Entre na sua turma</h3>
                <p className="text-xs text-gray-600 mt-1 mb-3">Conecte-se com outros estudantes da sua área</p>
                
                <div className="flex items-center -space-x-2 mb-3">
                  <Avatar className="border-2 border-white h-7 w-7">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-[10px]">D</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-2 border-white h-7 w-7">
                    <AvatarFallback className="bg-green-100 text-green-600 text-[10px]">M</AvatarFallback>
                  </Avatar>
                  <Avatar className="border-2 border-white h-7 w-7">
                    <AvatarFallback className="bg-amber-100 text-amber-600 text-[10px]">J</AvatarFallback>
                  </Avatar>
                  <div className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                    <span className="text-[10px] text-gray-500">+5</span>
                  </div>
                </div>
                
                <Link 
                  to="/comunidade"
                  className="bg-[#E36322] text-white px-4 py-2 rounded-full text-xs font-medium inline-flex items-center"
                >
                  Entrar
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tips Section */}
        <div>
          <div className="mb-3">
            <h2 className="text-lg font-bold text-gray-800">Dicas para você</h2>
          </div>

          <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-xl">
            <CardContent className="p-4">
              <h3 className="font-bold text-base text-gray-800">Tips para um melhor aprendizado</h3>
              <p className="text-xs text-gray-600 mt-1 mb-3">
                Aprenda como otimizar seus estudos com estas estratégias comprovadas
              </p>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs text-gray-700">
                  <div className="h-2 w-2 rounded-full bg-[#E36322]"></div>
                  <span>Estude por 25 minutos e descanse por 5</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-700">
                  <div className="h-2 w-2 rounded-full bg-[#E36322]"></div>
                  <span>Faça anotações durante as aulas</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-700">
                  <div className="h-2 w-2 rounded-full bg-[#E36322]"></div>
                  <span>Revise seu conteúdo regularmente</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default DashboardPage;
