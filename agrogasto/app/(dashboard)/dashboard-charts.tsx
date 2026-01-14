'use client';

import { useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import styles from './dashboard.module.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type DashboardData = {
    landStats: {
        name: string;
        expenses: number;
        income: number;
        profit: number;
    }[];
    globalStats: {
        totalExpenses: number;
        totalIncome: number;
        netProfit: number;
    }
};

export default function DashboardCharts({ data }: { data: DashboardData }) {
    const chartsRef = useRef<HTMLDivElement>(null);

    const handleExportPDF = async () => {
        if (!chartsRef.current) return;

        const canvas = await html2canvas(chartsRef.current);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.text("Reporte General - AgroGasto", 10, 10);
        pdf.setFontSize(10);
        pdf.text("Generado con Inteligencia Artificial - Resumen Financiero", 10, 16);

        pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
        pdf.save("reporte_dashboard.pdf");
    };

    return (
        <div ref={chartsRef}>
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleExportPDF} style={{
                    background: '#2563eb', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                    cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    📥 Exportar PDF (IA Report)
                </button>
            </div>
            <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                    <h3 className="text-lg font-bold text-emerald-950 mb-4">Gastos vs Ingresos por Terreno</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data.landStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#334155' }} stroke="#cbd5e1" />
                                <YAxis tick={{ fill: '#334155' }} stroke="#cbd5e1" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#1e293b' }}
                                    formatter={(value: any) => `S/ ${value?.toLocaleString('es-PE')}`}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="expenses" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <h3 className="text-lg font-bold text-emerald-950 mb-4">Rentabilidad por Terreno</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data.landStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#334155' }} stroke="#cbd5e1" />
                                <YAxis tick={{ fill: '#334155' }} stroke="#cbd5e1" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#1e293b' }}
                                    formatter={(value: any) => `S/ ${value?.toLocaleString('es-PE')}`}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="profit" name="Ganancia Neta" radius={[4, 4, 0, 0]}>
                                    {data.landStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#16a34a' : '#dc2626'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
