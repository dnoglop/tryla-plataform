
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Profile } from "@/services/profileService";

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const { data: session } = await supabase.auth.getSession();
        const user = session?.session?.user;

        if (user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select(`full_name, username, bio, avatar_url, linkedin_url`)
            .eq('id', user.id)
            .single();

          if (error) {
            throw error;
          }

          setProfile({
            id: user.id,
            full_name: profileData?.full_name || "",
            username: profileData?.username || user.email?.split('@')[0] || "",
            avatar_url: profileData?.avatar_url,
            bio: profileData?.bio || "",
            linkedin_url: profileData?.linkedin_url || "",
            level: profileData?.level || 1,
            xp: profileData?.xp || 0,
          });
          
          setFullName(profileData?.full_name || "");
          setUsername(profileData?.username || user.email?.split('@')[0] || "");
          setBio(profileData?.bio || "");
          setLinkedinUrl(profileData?.linkedin_url || "");
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [toast]);

  const updateProfile = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;

      if (user) {
        const updates = {
          id: user.id,
          full_name: fullName,
          username: username,
          bio: bio,
          linkedin_url: linkedinUrl,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('profiles').upsert(updates, {
          returning: 'minimal', // Do not return the value after inserting
        });

        if (error) {
          throw error;
        }

        setProfile(prev => ({ 
          ...prev!, 
          full_name: fullName, 
          username: username,
          bio: bio,
          linkedin_url: linkedinUrl
        }));

        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso!",
        });
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title="Perfil" />

      <div className="container px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-trilha-orange border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Seu nome de usuário"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bio">Sobre você</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Compartilhe um pouco sobre você"
                rows={4}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/seuperfil"
              />
            </div>

            <Button onClick={updateProfile} disabled={loading} className="w-full bg-trilha-orange text-white hover:bg-trilha-orange/90">
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                "Atualizar Perfil"
              )}
            </Button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
