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
                    <h3>Gastos vs Ingresos por Terreno</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data.landStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `S/ ${value?.toLocaleString('es-PE')}`} />
                                <Legend />
                                <Bar dataKey="expenses" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <h3>Rentabilidad por Terreno</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data.landStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `S/ ${value?.toLocaleString('es-PE')}`} />
                                <Legend />
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
