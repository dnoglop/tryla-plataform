// ARQUIVO: src/components/profile/ProfileIdentityCard.tsx (VERSÃO FINAL COM DESTAQUE)

import { Profile } from "@/services/profileService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Linkedin } from "lucide-react";

// Função helper para calcular a idade (sem alteração)
const calculateAge = (birthDate: string | null): string => {
  if (!birthDate) return "Idade não informada";
  const birthday = new Date(birthDate);
  const ageDifMs = Date.now() - birthday.getTime();
  const ageDate = new Date(ageDifMs);
  return `${Math.abs(ageDate.getUTCFullYear() - 1970)} anos`;
};

interface ProfileIdentityCardProps {
  profile: Profile;
}

export const ProfileIdentityCard: React.FC<ProfileIdentityCardProps> = ({ profile }) => {
  const age = calculateAge(profile.birth_date);
  const fallbackInitial = profile.full_name ? profile.full_name[0].toUpperCase() : "U";

  return (
    // ==========================================================
    // MUDANÇA PRINCIPAL: Classes de estilo do card
    // Adicionado bg-primary/10 (light) e bg-primary/20 (dark)
    // Adicionado shadow-lg para maior destaque
    // ==========================================================
    <div className="rounded-2xl bg-primary/10 dark:bg-primary/20 p-6 shadow-lg">

      {/* SEÇÃO SUPERIOR: IDENTIDADE VISUAL */}
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
          <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name || "Avatar"} />
          <AvatarFallback className="text-4xl bg-muted">{fallbackInitial}</AvatarFallback>
        </Avatar>

        <div className="mt-4">
          {/* MUDANÇA: Cores do texto adaptadas para o novo fundo */}
          <h1 className="text-2xl font-bold text-primary dark:text-primary-foreground">
            {profile.full_name}
          </h1>
          <p className="text-primary/80 dark:text-primary-foreground/70 font-medium">
            {age}
          </p>

          {profile.linkedin_url && (
            <a 
              href={profile.linkedin_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-2 inline-block text-primary/90 dark:text-primary-foreground/80 hover:text-primary dark:hover:text-primary-foreground transition-colors" 
              aria-label="Perfil do LinkedIn"
            >
              <Linkedin className="h-6 w-6" />
            </a>
          )}
        </div>
      </div>

      {/* SEÇÃO "SOBRE MIM" */}
      {profile.bio && (
        // MUDANÇA: Cor do separador e dos textos
        <div className="mt-6 pt-4 border-t border-primary/20 dark:border-primary-foreground/20 text-center">
          <h3 className="font-bold text-lg text-primary dark:text-primary-foreground/90 mb-2">
            Sobre mim
          </h3>
          <p className="text-sm text-primary/80 dark:text-primary-foreground/80 leading-relaxed whitespace-pre-wrap">
            {profile.bio}
          </p>
        </div>
      )}
    </div>
  );
};