'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useState } from 'react';
import { addExpense, addIncome, deleteExpense, deleteIncome } from '@/app/actions/transaction';
import { Wallet, TrendingUp, TrendingDown, Calendar, Plus, Trash2, AlertTriangle, FileText } from 'lucide-react';
import styles from './season.module.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Expense = { id: number; date: Date; amount: number; category: string; note: string | null };
type Income = { id: number; date: Date; quantity: number; unitPrice: number; totalPrice: number; isEstimated: boolean; unit: string };
type Season = {
    id: number;
    expenses: Expense[];
    incomes: Income[];
    land: { name: string };
    crop: { name: string };
};
type Anomaly = { type: string; severity: 'low' | 'medium' | 'high'; message: string };

export default function SeasonDashboardManager({ season, anomalies }: { season: Season; anomalies: Anomaly[] }) {
    const [tab, setTab] = useState<'overview' | 'expenses' | 'income'>('overview');
    const [showForm, setShowForm] = useState(false);

    // Calculations
    const totalExpenses = season.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const realIncome = season.incomes.filter(i => !i.isEstimated).reduce((acc, curr) => acc + curr.totalPrice, 0);
    const estimatedIncome = season.incomes.filter(i => i.isEstimated).reduce((acc, curr) => acc + curr.totalPrice, 0);
    const profit = realIncome - totalExpenses;
    const projectedProfit = (realIncome + estimatedIncome) - totalExpenses;

    // Simple handlers
    async function handleDelExpense(id: number) {
        if (confirm('Eliminar?')) await deleteExpense(id);
    }
    async function handleDelIncome(id: number) {
        if (confirm('Eliminar?')) await deleteIncome(id);
    }

    async function handleExportPDF() {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(22, 163, 74); // Green Header
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('AgroGasto - Informe de Temporada', 14, 20);

        // Info Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 40);

        autoTable(doc, {
            startY: 45,
            body: [
                ['Terreno', season.land.name],
                ['Cultivo', season.crop.name],
                ['Estado', profit >= 0 ? 'Rentable' : 'Déficit']
            ],
            theme: 'plain',
            styles: { fontSize: 12, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', minCellWidth: 30 } }
        });

        // Summary Table
        doc.text('Resumen Financiero', 14, (doc as any).lastAutoTable.finalY + 10);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 15,
            head: [['Concepto', 'Monto']],
            body: [
                ['Ingresos Reales', `S/ ${realIncome.toLocaleString('es-PE')}`],
                ['Gastos Totales', `S/ ${totalExpenses.toLocaleString('es-PE')}`],
                ['Rentabilidad Neta', `S/ ${profit.toLocaleString('es-PE')}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [22, 163, 74] },
            columnStyles: { 1: { halign: 'right' } }
        });

        // Expenses Detail
        doc.text('Detalle de Gastos', 14, (doc as any).lastAutoTable.finalY + 10);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 15,
            head: [['Fecha', 'Categoría', 'Nota', 'Monto']],
            body: season.expenses.map(e => [
                format(new Date(e.date), 'dd/MM/yyyy'),
                e.category,
                e.note || '-',
                `S/ ${e.amount.toLocaleString('es-PE')}`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [60, 60, 60] }
        });

        // Income Detail
        doc.text('Detalle de Ingresos', 14, (doc as any).lastAutoTable.finalY + 10);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 15,
            head: [['Fecha', 'Detalle', 'Tipo', 'Total']],
            body: season.incomes.map(i => [
                format(new Date(i.date), 'dd/MM/yyyy'),
                `${i.quantity} ${i.unit} a S/ ${i.unitPrice}`,
                i.isEstimated ? 'Estimado' : 'Real',
                `S/ ${i.totalPrice.toLocaleString('es-PE')}`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [60, 60, 60] }
        });

        doc.save(`Informe_Profesional_${season.crop.name}.pdf`);
    }

    return (
        <>
            <div className={styles.titleRow}>
            </div>

            <div className={styles.exportActions} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button onClick={handleExportPDF} className={styles.exportBtn}>
                    📄 Informe PDF
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => {
                        const ws = XLSX.utils.json_to_sheet(season.expenses.map(e => ({
                            Fecha: format(new Date(e.date), 'dd/MM/yyyy'),
                            Categoria: e.category,
                            Nota: e.note,
                            Monto: e.amount
                        })));
                        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Gastos");
                        XLSX.writeFile(wb, `Gastos_${season.id}.xlsx`);
                    }} className={styles.exportBtn} style={{ background: '#059669', borderColor: '#059669' }}>
                        📊 Excel Gastos
                    </button>
                    <button onClick={() => {
                        const ws = XLSX.utils.json_to_sheet(season.incomes.map(i => ({
                            Fecha: format(new Date(i.date), 'dd/MM/yyyy'),
                            Detalle: `${i.quantity} ${i.unit} a S/ ${i.unitPrice}`,
                            Tipo: i.isEstimated ? 'Estimado' : 'Real',
                            Total: i.totalPrice
                        })));
                        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
                        XLSX.writeFile(wb, `Ingresos_${season.id}.xlsx`);
                    }} className={styles.exportBtn} style={{ background: '#059669', borderColor: '#059669' }}>
                        📊 Excel Ingresos
                    </button>
                </div>
            </div>

            {/* Anomalies Alert */}
            {anomalies.length > 0 && (
                <div className={styles.anomaliesContainer}>
                    <div className={styles.anomalyHeader}>
                        <AlertTriangle size={20} />
                        <h3>Alertas de Anomalías Detectadas</h3>
                    </div>
                    <ul className={styles.anomalyList}>
                        {anomalies.map((a, idx) => (
                            <li key={idx} className={`${styles.anomalyItem} ${styles[a.severity]}`}>
                                {a.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* KPI Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#fee2e2', color: '#ef4444' }}>
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className={styles.statLabel}>Gastos Totales</p>
                        <p className={styles.statValue}>S/ {totalExpenses.toLocaleString('es-PE')}</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#dcfce7', color: '#22c55e' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className={styles.statLabel}>Ingresos Reales</p>
                        <p className={styles.statValue}>S/ {realIncome.toLocaleString('es-PE')}</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className={styles.statLabel}>Rentabilidad Actual</p>
                        <p className={styles.statValue} style={{ color: profit >= 0 ? '#16a34a' : '#ef4444' }}>
                            S/ {profit.toLocaleString('es-PE')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button onClick={() => { setTab('overview'); setShowForm(false); }} className={`${styles.tab} ${tab === 'overview' ? styles.activeTab : ''}`}>Resumen</button>
                <button onClick={() => { setTab('expenses'); setShowForm(false); }} className={`${styles.tab} ${tab === 'expenses' ? styles.activeTab : ''}`}>Gastos</button>
                <button onClick={() => { setTab('income'); setShowForm(false); }} className={`${styles.tab} ${tab === 'income' ? styles.activeTab : ''}`}>Ventas</button>
            </div>

            <div className={styles.content}>
                {(tab === 'expenses' || tab === 'income') && (
                    <div className={styles.toolbar}>
                        <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
                            <Plus size={18} />
                            {showForm ? 'Cancelar' : (tab === 'expenses' ? 'Registrar Gasto' : 'Registrar Venta')}
                        </button>
                    </div>
                )}

                {/* Forms */}
                {showForm && tab === 'expenses' && (
                    <form action={async (fd) => { fd.append('seasonId', season.id.toString()); await addExpense(fd); setShowForm(false); }} className={styles.formInline}>
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className={styles.input} />
                        <select name="category" className={styles.input}>
                            <option>Fertilizante</option>
                            <option>Riego</option>
                            <option>Mano de Obra</option>
                            <option>Semillas</option>
                            <option>Transporte</option>
                            <option>Otros</option>
                        </select>
                        <input type="number" name="amount" placeholder="Monto" step="0.01" required className={styles.input} />
                        <input type="text" name="unit" placeholder="Unidad (kg, saco)" className={styles.input} />
                        <input type="text" name="note" placeholder="Nota" className={styles.input} />
                        <button type="submit" className={styles.submitBtn}>Guardar</button>
                    </form>
                )}

                {showForm && tab === 'income' && (
                    <form action={async (fd) => { fd.append('seasonId', season.id.toString()); await addIncome(fd); setShowForm(false); }} className={styles.formInline}>
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className={styles.input} />
                        <input type="number" name="quantity" placeholder="Cant." step="0.01" required className={styles.input} />
                        <input type="text" name="unit" placeholder="Unidad" required className={styles.input} />
                        <input type="number" name="unitPrice" placeholder="Precio Unit." step="0.01" required className={styles.input} />
                        <label className={styles.checkbox}>
                            <input type="checkbox" name="isEstimated" /> Estimado
                        </label>
                        <button type="submit" className={styles.submitBtn}>Guardar</button>
                    </form>
                )}

                {/* Lists */}
                {tab === 'expenses' && (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Categoría</th>
                                <th>Nota</th>
                                <th>Monto</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {season.expenses.map(exp => (
                                <tr key={exp.id}>
                                    <td>{format(new Date(exp.date), 'dd/MM/yyyy')}</td>
                                    <td>{exp.category}</td>
                                    <td>{exp.note}</td>
                                    <td className={styles.amount}>S/ {exp.amount.toLocaleString('es-PE')}</td>
                                    <td>
                                        <button onClick={() => handleDelExpense(exp.id)} className={styles.trashBtn}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {tab === 'income' && (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Detalle</th>
                                <th>Tipo</th>
                                <th>Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {season.incomes.map(inc => (
                                <tr key={inc.id}>
                                    <td>{format(new Date(inc.date), 'dd/MM/yyyy')}</td>
                                    <td>{inc.quantity} {inc.unit} a S/ {inc.unitPrice}</td>
                                    <td>{inc.isEstimated ? <span className={styles.badgeEst}>Estimado</span> : <span className={styles.badgeReal}>Real</span>}</td>
                                    <td className={styles.amount}>S/ {inc.totalPrice.toLocaleString('es-PE')}</td>
                                    <td>
                                        <button onClick={() => handleDelIncome(inc.id)} className={styles.trashBtn}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {tab === 'overview' && (
                    <div className={styles.overviewPanel}>
                        <h3>Proyección Financiera</h3>
                        <p>Considerando los ingresos estimados, el beneficio proyectado es de: <strong>S/ {projectedProfit.toLocaleString('es-PE')}</strong></p>
                    </div>
                )}
            </div>
        </>
    );
}
