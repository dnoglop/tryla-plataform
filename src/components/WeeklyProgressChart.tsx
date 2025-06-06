import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { getFormattedWeeklyData } from '@/services/dailyXpService';

interface WeeklyProgressChartProps {
  streak: number;
  userId?: string;
}

// --- Componente de Esqueleto para o Gráfico ---
const ChartSkeleton = () => (
    <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50 animate-pulse">
        <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-32 bg-slate-200" />
            <Skeleton className="h-8 w-20 rounded-full bg-slate-200" />
        </div>
        <div className="flex justify-between items-end h-24 gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full h-full flex items-end">
                        <Skeleton className="w-full rounded-lg bg-slate-200" style={{ height: `${Math.random() * 70 + 10}%` }} />
                    </div>
                    <Skeleton className="h-4 w-4 bg-slate-200" />
                </div>
            ))}
        </div>
        <div className="mt-3 text-center">
            <Skeleton className="h-4 w-40 mx-auto bg-slate-200" />
        </div>
    </div>
);


// --- Componente Principal do Gráfico ---
export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({ streak, userId }) => {
  const { data: weeklyData = [], isLoading, error } = useQuery({
    queryKey: ['weeklyXpProgress', userId],
    queryFn: () => {
      if (!userId) {
        // Se não houver userId, retorna um array de 7 dias com 0 XP para evitar quebrar a UI
        const dayLabels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
        return Promise.resolve(
          Array.from({ length: 7 }).map((_, i) => ({
            date: `day-${i}`,
            day: dayLabels[i] || '?',
            xp: 0
          }))
        );
      }
      return getFormattedWeeklyData(userId);
    },
    enabled: !!userId, // O hook só roda se o userId estiver presente
  });

  // Estado de Carregamento
  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Estado de Erro
  if (error) {
    console.error("Erro ao buscar dados do gráfico semanal:", error);
    return (
        <div className="rounded-2xl bg-white p-4 sm:p-6 text-center text-red-500">
            Não foi possível carregar o progresso.
        </div>
    );
  }

  // Encontra o maior valor de XP na semana para normalizar a altura das barras.
  // Garante que o valor máximo seja pelo menos 50 para que as barras não fiquem muito altas com valores baixos.
  const maxXp = Math.max(...weeklyData.map(item => item.xp), 50);
  const totalWeeklyXp = weeklyData.reduce((total, item) => total + item.xp, 0);

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-slate-200/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-700">Progresso Semanal</h3>
        <div className="flex items-center gap-1.5 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full text-sm font-bold">
          <Flame size={16} />
          <span>{streak || 0} dias</span>
        </div>
      </div>

      {/* Container do Gráfico com altura fixa */}
      <div className="flex justify-between items-end h-24 gap-2">
        {weeklyData.map((item, index) => {
          // Lógica de cálculo da altura
          const barHeightPercentage = item.xp > 0 ? (item.xp / maxXp) * 100 : 0;
          
          return (
            <div key={`${item.date}-${index}`} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
              {/* Container da Barra com flex-grow para ocupar espaço */}
              <div className="w-full flex-grow flex items-end relative group">
                {item.xp > 0 ? (
                  // Barra para dias com XP
                  <div
                    className="w-full bg-orange-400 rounded-lg transition-all duration-500 ease-out hover:bg-orange-500 shadow-sm"
                    style={{ height: `${barHeightPercentage}%` }}
                  />
                ) : (
                  // Linha de base para dias sem XP
                  <div className="w-full h-1 bg-slate-200 rounded-full" />
                )}

                {/* Tooltip que aparece no hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {item.xp} XP
                </div>
              </div>

              {/* Rótulo do Dia */}
              <span className="text-xs font-medium text-slate-500 shrink-0">{item.day}</span>
            </div>
          );
        })}
      </div>
      
      {/* Total de XP da semana */}
      <div className="mt-3 text-center">
        <p className="text-xs text-slate-500">
          Total da semana: {totalWeeklyXp} XP
        </p>
      </div>
    </div>
  );
};