export default function RecentActivity() {
    const activities = [
        { id: 1, type: 'expense', title: 'Compra de Semillas', date: 'Hace 2 horas', amount: '-$450.00', status: 'completed' },
        { id: 2, type: 'income', title: 'Venta de Maíz (Adelanto)', date: 'Ayer', amount: '+$1,200.00', status: 'completed' },
        { id: 3, type: 'expense', title: 'Pago Jornaleros', date: 'Hace 2 días', amount: '-$320.00', status: 'pending' },
        { id: 4, type: 'expense', title: 'Fertilizantes NPK', date: 'Semana pasada', amount: '-$850.00', status: 'completed' },
    ];

    return (
        <div className="glass-panel p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Actividad Reciente</h3>
            <div className="flex flex-col gap-3">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                ${activity.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
              `}>
                                {activity.type === 'income' ? '💰' : '💸'}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">{activity.title}</p>
                                <p className="text-xs text-gray-500">{activity.date}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-bold text-sm ${activity.type === 'income' ? 'text-green-600' : 'text-gray-800'}`}>
                                {activity.amount}
                            </p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize
                ${activity.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
              `}>
                                {activity.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors">
                Ver todo el historial
            </button>
        </div>
    );
}
