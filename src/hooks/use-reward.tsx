
import { useState } from 'react';

interface RewardData {
  xp: number;
  title: string;
  message: string;
  type: "phase_completion" | "daily_task" | "module_completion";
}

export const useReward = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [rewardData, setRewardData] = useState<RewardData | null>(null);

  const showReward = (data: RewardData) => {
    setRewardData(data);
    setIsVisible(true);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  };

  const hideReward = () => {
    setIsVisible(false);
  };

  return {
    showReward,
    hideReward,
    isVisible,
    rewardData
  };
};
