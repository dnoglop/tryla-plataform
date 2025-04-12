import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";

interface Profile {
  id: string;
  name: string;
  email: string;
  // created_at: string; // Assuming you don't need this, or it's handled elsewhere
  // Add other profile properties as needed
}

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
            .select(`name, email`)
            .eq('id', user.id)
            .single();

          if (error) {
            throw error;
          }

          setProfile({
            id: user.id,
            name: profileData?.name || "",
            email: profileData?.email || user.email || "",
            // created_at: profileData?.created_at || "", // If you have created_at
          });
          setName(profileData?.name || user.email?.split('@')[0] || "");
          setEmail(profileData?.email || user.email || "");
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
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
          name: name,
          email: email,
          updated_at: new Date(),
        };

        const { error } = await supabase.from('profiles').upsert(updates, {
          returning: 'minimal', // Do not return the value after inserting
        });

        if (error) {
          throw error;
        }

        setProfile({ ...profile, name: name, email: email });

        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled={true}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Display the profile creation date if needed */}
            {/* {profile && (
              <p className="text-sm text-gray-500">
                Membro desde: {new Date(profile.created_at).toLocaleDateString()}
              </p>
            )} */}

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
