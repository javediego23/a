interface StatsCardProps {
    title: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: string;
    colorClass?: string;
}

export default function StatsCard({ title, value, trend, trendUp, icon, colorClass = 'bg-primary' }: StatsCardProps) {
    return (
        <div className="glass-panel p-6 flex items-start justify-between hover:translate-y-[-2px] transition-transform duration-300">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                {trend && (
                    <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
                        <span>{trendUp ? '↑' : '↓'}</span>
                        {trend}
                    </p>
                )}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm text-white ${colorClass}`}>
                {icon}
            </div>
        </div>
    );
}
