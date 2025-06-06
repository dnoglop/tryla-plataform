
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Flame } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { getFormattedWeeklyData } from '@/services/dailyXpService';

interface WeeklyProgressChartProps {
  streak: number;
  userId?: string;
}

interface WeeklyDataItem {
  day: string;
  xp: number;
  date: string;
}

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({ streak, userId }) => {
  const { data: weeklyData = [], isLoading, error } = useQuery({
    queryKey: ['weeklyXpProgress', userId],
    queryFn: () => userId ? getFormattedWeeklyData(userId) : Promise.resolve([]),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  // Debug logs
  useEffect(() => {
    console.log('WeeklyProgressChart - userId:', userId);
    console.log('WeeklyProgressChart - weeklyData:', weeklyData);
    console.log('WeeklyProgressChart - isLoading:', isLoading);
    console.log('WeeklyProgressChart - error:', error);
  }, [userId, weeklyData, isLoading, error]);

  // Calcular porcentagem máxima para normalizar o gráfico
  const maxXp = Math.max(...weeklyData.map(item => item.xp), 1);
  
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
        <div className="flex justify-between items-end h-24 gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className="w-full h-full rounded-lg" />
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-700">Progresso Semanal</h3>
        <div className="flex items-center gap-1.5 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full text-sm font-bold">
          <Flame size={16} />
          <span>{streak || 0} dias</span>
        </div>
      </div>
      <div className="flex justify-between items-end h-24 gap-2">
        {weeklyData.map((item, index) => {
          const percentage = maxXp > 0 ? (item.xp / maxXp) * 100 : 0;
          const minHeight = item.xp > 0 ? Math.max(percentage, 8) : 0;
          
          return (
            <div key={`${item.date}-${index}`} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full h-full flex items-end relative group">
                <div
                  className="w-full bg-gradient-to-t from-orange-400 to-orange-500 rounded-lg transition-all duration-700 ease-out hover:from-orange-500 hover:to-orange-600"
                  style={{ height: `${minHeight}%` }}
                  title={`${item.day}: ${item.xp} XP`}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.xp} XP
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500">{item.day}</span>
            </div>
          );
        })}
      </div>
      {weeklyData.length > 0 && (
        <div className="mt-3 text-center">
          <p className="text-xs text-slate-500">
            Total da semana: {weeklyData.reduce((total, item) => total + item.xp, 0)} XP
          </p>
        </div>
      )}
    </div>
  );
};
