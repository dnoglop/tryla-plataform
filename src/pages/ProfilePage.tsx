
import { useState, useEffect } from "react";
import { LogOut, Mail, Link as LinkIcon, Settings, Camera } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import UserLevel from "@/components/UserLevel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentProfile, updateProfile, uploadAvatar, Profile } from "@/services/profileService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "",
    bio: "",
    linkedin_url: "",
  });
  
  const achievements = [
    { title: "Módulos Completos", value: 1, total: 5 },
    { title: "Fases Completas", value: 3, total: 20 },
    { title: "Emblemas", value: 2, total: 3 },
  ];
  
  const badges = [
    { icon: "🚀", name: "Primeiro Passo" },
    { icon: "👥", name: "Explorador(a) Social" },
    { icon: "🎯", name: "Fera nos Quizzes" },
  ];

  useEffect(() => {
    loadProfile();
  }, []);
  
  const loadProfile = async () => {
    const profileData = await getCurrentProfile();
    if (profileData) {
      setProfile(profileData);
      setEditForm({
        full_name: profileData.full_name || "",
        username: profileData.username || "",
        bio: profileData.bio || "",
        linkedin_url: profileData.linkedin_url || "",
      });
    } else {
      toast.error("Erro ao carregar perfil");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Salvar alterações
      updateProfile({
        full_name: editForm.full_name,
        username: editForm.username,
        bio: editForm.bio,
        linkedin_url: editForm.linkedin_url
      }).then((success) => {
        if (success) {
          loadProfile();
        }
      });
    }
    setIsEditing(!isEditing);
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const url = await uploadAvatar(file);
      if (url && profile) {
        setProfile({...profile, avatar_url: url});
        toast.success("Foto de perfil atualizada!");
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-trilha-orange border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title="👤 Seu Perfil" />

      <div className="bg-gradient-to-b from-trilha-orange to-amber-400 py-6 relative">
        <div className="container px-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-4 border-white">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                <AvatarFallback className="text-xl bg-amber-200 text-amber-800">
                  {profile.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              
              <Dialog>
                <DialogTrigger asChild>
                  <button className="absolute bottom-0 right-0 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow">
                    <Camera className="h-4 w-4 text-trilha-orange" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Alterar foto de perfil</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Label htmlFor="avatar">Selecione uma nova imagem</Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={isUploading}
                    />
                    {isUploading && <p className="text-sm text-gray-500">Enviando...</p>}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex-1 text-white">
              {isEditing ? (
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  className="bg-white/20 border-0 text-white placeholder-white/70 mb-1"
                  placeholder="Seu nome completo"
                />
              ) : (
                <h1 className="text-xl font-bold">{profile.full_name}</h1>
              )}
              
              {isEditing ? (
                <div className="flex items-center">
                  <span className="text-white/80 mr-1">@</span>
                  <Input
                    value={editForm.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    className="bg-white/20 border-0 text-white placeholder-white/70"
                    placeholder="Seu nome de usuário"
                  />
                </div>
              ) : (
                <p className="text-white/80">@{profile.username}</p>
              )}
            </div>
            <button
              onClick={handleEditToggle}
              className="rounded-full bg-white/20 p-2"
            >
              <Settings className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="mt-4">
            <UserLevel 
              level={profile.level} 
              currentXP={profile.xp} 
              nextLevelXP={(profile.level + 1) * 150} 
              showLevel={false}
            />
            <div className="mt-1 flex justify-between text-xs text-white/90">
              <span>Nível {profile.level}</span>
              <span>Nível {profile.level + 1}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 space-y-6 -mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm relative z-10">
          <div className="mb-4">
            <h2 className="font-bold">Sobre mim</h2>
            {isEditing ? (
              <Textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                placeholder="Conte um pouco sobre você..."
                className="mt-1 w-full"
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-600 mt-1">{profile.bio || "Nenhuma informação adicional."}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs">
              <Mail className="h-3 w-3 text-gray-500" />
              <span>Na Trilha desde {new Date(profile.created_at || Date.now()).toLocaleDateString("pt-BR", {month: "short", year: "numeric"})}</span>
            </div>
            {isEditing ? (
              <div className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs w-full mt-1">
                <LinkIcon className="h-3 w-3 text-gray-500 shrink-0" />
                <Input
                  value={editForm.linkedin_url}
                  onChange={(e) => setEditForm({...editForm, linkedin_url: e.target.value})}
                  className="h-5 text-xs p-0 border-0 bg-transparent"
                  placeholder="Seu link do LinkedIn"
                />
              </div>
            ) : profile.linkedin_url ? (
              <a 
                href={profile.linkedin_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs"
              >
                <LinkIcon className="h-3 w-3 text-gray-500" />
                <span>LinkedIn</span>
              </a>
            ) : null}
          </div>
          
          {isEditing && (
            <div className="mt-4">
              <Button 
                onClick={handleEditToggle} 
                className="w-full bg-trilha-orange hover:bg-trilha-orange/90 text-white"
              >
                Salvar alterações
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-bold mb-4">Meus Emblemas</h2>
          <div className="flex justify-between">
            {badges.map((badge, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-trilha-orange/10 text-2xl shadow-inner">
                  {badge.icon}
                </div>
                <span className="mt-1 text-xs text-center">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-bold mb-4">Conquistas</h2>
          <div className="space-y-4">
            {achievements.map((achievement, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{achievement.title}</span>
                  <span className="text-sm font-medium text-trilha-orange">
                    {achievement.value}/{achievement.total}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-trilha-orange"
                    style={{
                      width: `${(achievement.value / achievement.total) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Separator className="my-6" />
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="w-full flex items-center gap-2 text-gray-600"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
