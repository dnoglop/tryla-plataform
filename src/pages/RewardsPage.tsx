
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import BadgeItem from "@/components/BadgeItem";
import { useToast } from "@/components/ui/use-toast";

const RewardsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("badges");
  
  // Dados de exemplo para recompensas
  const badges = [
    {
      id: 1,
      title: "Primeiro Passo",
      description: "Completou sua primeira fase",
      earned: true,
      icon: "🚀",
    },
    {
      id: 2,
      title: "Mestre do Autoconhecimento",
      description: "Completou o módulo Mestre de Si",
      earned: false,
      icon: "🧠",
    },
    {
      id: 3,
      title: "Explorador(a) Social",
      description: "Fez 3 postagens na comunidade",
      earned: true,
      icon: "👥",
    },
    {
      id: 4,
      title: "Fera nos Quizzes",
      description: "Acertou 10 perguntas consecutivas",
      earned: true,
      icon: "🎯",
    },
    {
      id: 5,
      title: "Desafiador(a)",
      description: "Completou 5 desafios práticos",
      earned: false,
      icon: "🏆",
    },
  ];

  const rewards = [
    {
      id: 1,
      title: "Papel de Parede Exclusivo",
      description: "Desbloqueie um visual personalizado",
      price: 200,
      icon: "🖼️",
    },
    {
      id: 2,
      title: "Avatar Premium",
      description: "Personalize seu perfil com um avatar único",
      price: 300,
      icon: "👤",
    },
    {
      id: 3,
      title: "Emblema Raro",
      description: "Mostre seu status com este emblema exclusivo",
      price: 500,
      icon: "⭐",
    },
  ];

  const handleBuyReward = (id: number, price: number) => {
    toast({
      title: "Recompensa adquirida!",
      description: `Você gastou ${price} pontos`,
      duration: 3000,
    });
  };

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title="🏆 Central de Recompensas" />

      <div className="bg-gradient-to-b from-amber-100 to-orange-50 py-6">
        <div className="container px-4 text-center">
          <h1 className="text-2xl font-bold">Suas Conquistas</h1>
          <p className="mt-2 text-gray-700">
            Continue sua trilha para ganhar mais recompensas!
          </p>
          
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <div className="text-xl font-bold text-trilha-orange">3</div>
              <div className="text-xs text-gray-600">Badges</div>
            </div>
            <div className="h-10 w-px bg-gray-300"></div>
            <div className="flex flex-col items-center">
              <div className="text-xl font-bold text-trilha-orange">750</div>
              <div className="text-xs text-gray-600">Pontos</div>
            </div>
            <div className="h-10 w-px bg-gray-300"></div>
            <div className="flex flex-col items-center">
              <div className="text-xl font-bold text-trilha-orange">2</div>
              <div className="text-xs text-gray-600">Fases</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6">
        <Tabs
          defaultValue="badges"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="badges">Emblemas</TabsTrigger>
            <TabsTrigger value="store">Loja</TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {badges.map((badge) => (
                <BadgeItem key={badge.id} {...badge} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="store" className="space-y-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Seu saldo</h2>
                <div className="rounded-full bg-trilha-orange px-3 py-1 text-sm font-bold text-white">
                  750 pontos
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {rewards.map((reward) => (
                <div key={reward.id} className="card-trilha p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-trilha-orange/10 text-3xl">
                      {reward.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{reward.title}</h3>
                      <p className="text-sm text-gray-600">
                        {reward.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleBuyReward(reward.id, reward.price)}
                      className="rounded-full bg-trilha-orange px-3 py-2 text-sm font-semibold text-white"
                    >
                      {reward.price} pts
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default RewardsPage;
