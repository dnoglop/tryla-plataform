
// src/components/WeeklyProgressChart.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { getFormattedWeeklyData, FormattedWeeklyData } from '@/services/dailyXpService';

interface WeeklyProgressChartProps {
  streak: number;
  userId: string | null;
}

// --- Componente de Esqueleto para o Gráfico ---
const ChartSkeleton = () => (
    <div className="rounded-2xl bg-card p-4 sm:p-6 shadow-sm border animate-pulse">
        <div className="flex justify-between items-center mb-4">
            <div className="h-6 w-32 bg-muted rounded-md"></div>
            <div className="flex items-center gap-1.5">
                <div className="h-8 w-16 rounded-full bg-muted"></div>
            </div>
        </div>
        <div className="flex justify-between items-end h-24 gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full h-full flex items-end">
                        <div className="w-4/5 mx-auto rounded-lg bg-muted" style={{ height: `${Math.random() * 70 + 10}%` }} />
                    </div>
                    <div className="h-4 w-4 bg-muted rounded-sm"></div>
                </div>
            ))}
        </div>
        <div className="mt-3 text-center">
            <div className="h-4 w-40 mx-auto bg-muted rounded-md"></div>
        </div>
    </div>
);

// --- Componente Principal do Gráfico ---
export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({ streak, userId }) => {
  const { data: weeklyData = [], isLoading, isError } = useQuery<FormattedWeeklyData[], Error>({
    queryKey: ['weeklyXpHistory', userId], 
    queryFn: () => getFormattedWeeklyData(userId!),
    enabled: !!userId,
  });

  if (isLoading || !userId) {
    return <ChartSkeleton />;
  }

  if (isError) {
    console.error("Erro detectado pelo React Query no componente de gráfico.");
    return (
        <div className="rounded-2xl bg-card p-4 sm:p-6 text-center text-destructive border border-destructive/20">
            <p className="font-semibold">Ops!</p>
            <p className="text-sm">Não foi possível carregar o progresso.</p>
        </div>
    );
  }

  const maxXp = Math.max(...weeklyData.map(item => item.xp), 50);
  const totalWeeklyXp = weeklyData.reduce((total, item) => total + item.xp, 0);

  return (
    <div className="rounded-2xl bg-card p-4 sm:p-6 shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-card-foreground">Progresso Semanal</h3>
        <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-bold">
          <Flame size={16} />
          <span>{streak || 0} dias</span>
        </div>
      </div>

      <div className="flex justify-between items-end h-24 gap-2">
        {weeklyData.map((item, index) => {
          const barHeightPercentage = item.xp > 0 ? (item.xp / maxXp) * 100 : 0;
          
          return (
            <div key={`${item.date}-${index}`} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
              <div className="w-full flex-grow flex items-end relative group">
                {item.xp > 0 ? (
                  <div
                    className="w-4/5 mx-auto bg-primary rounded-lg transition-all duration-500 ease-out hover:bg-primary/90 shadow-sm"
                    style={{ height: `${barHeightPercentage}%` }}
                  />
                ) : (
                  <div className="w-full h-1 bg-muted rounded-full" />
                )}

                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none border">
                  {item.xp} XP
                </div>
              </div>

              <span className="text-xs font-medium text-muted-foreground shrink-0">{item.day}</span>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 text-center">
        <p className="text-xs text-muted-foreground">
          Total da semana: <span className="font-bold text-card-foreground">{totalWeeklyXp} XP</span>
        </p>
      </div>
    </div>
  );
};
