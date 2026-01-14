import { getDashboardData } from '@/app/actions/dashboard';
import DashboardCharts from './dashboard-charts';
import styles from './dashboard.module.css';

export default async function DashboardPage() {
    const data = await getDashboardData();

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-emerald-950 mt-8 mb-2">Panel General</h1>
                <p className="text-xl text-slate-600 font-light">Resumen de actividad agrícola y financiera</p>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Gastos Totales - Rojo Suave */}
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg hover:shadow-red-900/20 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        {/* Icon placeholder if needed */}
                    </div>
                    <p className="text-sm font-medium text-red-700 uppercase tracking-wider mb-2">Gastos Totales</p>
                    <p className="text-3xl font-bold text-slate-900">S/ {data.globalStats.totalExpenses.toLocaleString('es-PE')}</p>
                </div>

                {/* Ingresos Totales - Verde */}
                <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl group hover:shadow-lg hover:shadow-green-900/20 transition-all duration-300">
                    <p className="text-sm font-medium text-green-700 uppercase tracking-wider mb-2">Ingresos Totales</p>
                    <p className="text-3xl font-bold text-slate-900">S/ {data.globalStats.totalIncome.toLocaleString('es-PE')}</p>
                </div>

                {/* Ganancia Neta - Verde Fuerte */}
                <div className={`p-6 rounded-2xl border transition-all duration-300 group hover:shadow-lg ${data.globalStats.netProfit >= 0
                    ? 'bg-emerald-500/20 border-emerald-500/30 hover:shadow-emerald-900/20'
                    : 'bg-red-500/20 border-red-500/30 hover:shadow-red-900/20'
                    }`}>
                    <p className={`text-sm font-medium uppercase tracking-wider mb-2 ${data.globalStats.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}>Ganancia Neta</p>
                    <p className="text-3xl font-bold text-slate-900">S/ {data.globalStats.netProfit.toLocaleString('es-PE')}</p>
                </div>

                {/* Margen - Azul */}
                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl group hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-300">
                    <p className="text-sm font-medium text-blue-700 uppercase tracking-wider mb-2">Margen (KPI)</p>
                    <p className="text-3xl font-bold text-slate-900">
                        {data.globalStats.totalIncome > 0
                            ? ((data.globalStats.netProfit / data.globalStats.totalIncome) * 100).toFixed(1) + '%'
                            : '0%'}
                    </p>
                </div>
            </div>

            <DashboardCharts data={data} />
        </div>
    );
}
