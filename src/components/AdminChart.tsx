import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface ChartDataPoint {
  name: string; // O rótulo para o eixo X (ex: "15/Jun")
  value: number; // O valor para o eixo Y
}

interface AdminChartProps {
  data: ChartDataPoint[];
  title: string;
  color?: string;
  growth?: { value: number; positive: boolean };
}

const AdminChart = ({ data, title, color = "#f97316", growth }: AdminChartProps) => {
  // Cria um ID único para o gradiente com base no título para evitar conflitos se houver múltiplos gráficos na mesma página.
  const gradientId = `color-${title.replace(/\s+/g, '')}`;

  return (
    // Card com estilo Glassmorphism e transição suave
    <div className="glass-card p-4 sm:p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-80 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-base font-semibold text-slate-700">{title}</h3>
        {growth && (
          <p className={`text-sm font-medium ${growth.positive ? 'text-green-600' : 'text-red-600'}`}>
            {growth.positive ? '▲' : '▼'} {growth.value}%
          </p>
        )}
      </div>
      
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 105, 0.1)" />
            <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                backdropFilter: 'blur(5px)', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                borderRadius: '12px',
                boxShadow: 'none'
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