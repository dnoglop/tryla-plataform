import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  level?: number;
  xp?: number;
  streak_days?: number;
  bio?: string;
  linkedin_url?: string;
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        username, 
        full_name, 
        avatar_url, 
        website,
        email,
        created_at,
        updated_at,
        level,
        xp,
        streak_days,
        bio,
        linkedin_url
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error("Unexpected error fetching profile:", error);
    return null;
  }
};

export const updateProfile = async (userId: string, updates: Profile) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  } catch (error) {
    console.error("Unexpected error updating profile:", error);
    throw error;
  }
};

export const updateUserXp = async (userId: string, xpToAdd: number) => {
  try {
    // Fetch the current profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    if (!profileData) {
      throw new Error("Profile not found");
    }

    const currentXp = profileData.xp || 0;
    let currentLevel = profileData.level || 1;
    let newXp = currentXp + xpToAdd;
    let nextLevelXp = currentLevel * 100;

    // Check if the user has leveled up
    while (newXp >= nextLevelXp) {
      newXp -= nextLevelXp;
      currentLevel++;
      nextLevelXp = currentLevel * 100;
    }

    // Update the profile with new XP and level
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ xp: newXp, level: currentLevel })
      .eq('id', userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw updateError;
    }

    return { newXp, newLevel: currentLevel };
  } catch (error) {
    console.error("Unexpected error updating user XP:", error);
    throw error;
  }
};

export const getUserBadges = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        badge_id,
        unlocked_at,
        badges:badge_id (
          id,
          name,
          description,
          icon,
          xp_reward
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Transform the data to match the expected format
    return (data || []).map((item: any) => ({
      id: item.badge_id,
      name: item.badges?.name || '',
      description: item.badges?.description || '',
      icon: item.badges?.icon || '🏆',
      unlocked: true,
      xp_reward: item.badges?.xp_reward || 0
    }));
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }
};

export const getUserAchievements = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        achievement_id,
        unlocked_at,
        achievements:achievement_id (
          id,
          name,
          description,
          icon,
          xp_reward
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Transform the data to match the expected format
    return (data || []).map((item: any) => ({
      id: item.achievement_id,
      name: item.achievements?.name || '',
      description: item.achievements?.description || '',
      icon: item.achievements?.icon || '🏅',
      unlocked: true,
      xp_reward: item.achievements?.xp_reward || 0
    }));
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
};
