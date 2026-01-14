import { getDashboardData } from '@/app/actions/dashboard';
import DashboardCharts from './dashboard-charts';
import styles from './dashboard.module.css';

export default async function DashboardPage() {
    const data = await getDashboardData();

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827' }}>Panel General</h1>
                <p style={{ color: '#6b7280' }}>Resumen de actividad agrícola y financiera</p>
            </header>

            {/* Summary Cards */}
            <div className={styles.chartsGrid} style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
                <div className={styles.chartCard} style={{ borderLeft: '4px solid #ef4444' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Gastos Totales</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>S/ {data.globalStats.totalExpenses.toLocaleString('es-PE')}</p>
                </div>
                <div className={styles.chartCard} style={{ borderLeft: '4px solid #22c55e' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ingresos Totales</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>S/ {data.globalStats.totalIncome.toLocaleString('es-PE')}</p>
                </div>
                <div className={styles.chartCard} style={{ borderLeft: `4px solid ${data.globalStats.netProfit >= 0 ? '#16a34a' : '#dc2626'}` }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ganancia Neta</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>S/ {data.globalStats.netProfit.toLocaleString('es-PE')}</p>
                </div>
                <div className={styles.chartCard} style={{ borderLeft: '4px solid #3b82f6' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Margen (KPI)</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
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
