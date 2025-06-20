// src/components/admin/AdminChart.tsx

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Interface para os pontos de dados do gráfico
interface ChartDataPoint {
  name: string; // O rótulo para o eixo X (ex: "15/Jun")
  value: number; // O valor para o eixo Y
}

// Interface para as propriedades do componente
interface AdminChartProps {
  data: ChartDataPoint[];
  title: string;
  color?: string;
  growth?: { value: number; positive: boolean };
}

const AdminChart: React.FC<AdminChartProps> = ({
  data,
  title,
  color = "#f97316",
  growth,
}) => {
  // Cria um ID único para o gradiente para evitar conflitos
  const gradientId = `color-${title.replace(/\s+/g, "")}`;

  return (
    <div className="bg-card border rounded-2xl p-4 sm:p-6 shadow-sm h-80 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {growth && (
          <p
            className={`text-sm font-medium ${growth.positive ? "text-green-600" : "text-red-600"}`}
          >
            {growth.positive ? "▲" : "▼"} {growth.value}%
          </p>
        )}
      </div>

      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: "0.75rem", // 12px
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminChart;
