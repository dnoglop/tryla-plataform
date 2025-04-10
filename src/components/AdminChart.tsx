
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface AdminChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title: string;
  color?: string;
  growth?: {
    value: number;
    positive: boolean;
  };
}

const AdminChart = ({ data, title, color = "#F97316", growth }: AdminChartProps) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        {growth && (
          <div className="flex items-center">
            <span className={`text-sm font-medium ${growth.positive ? 'text-green-500' : 'text-red-500'}`}>
              {growth.positive ? '+' : '-'}{growth.value}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vs last week</span>
          </div>
        )}
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`color${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2} 
              fill={`url(#color${title.replace(/\s+/g, '')})`}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminChart;
