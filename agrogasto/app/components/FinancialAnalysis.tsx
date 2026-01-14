'use client';

import { useState, useRef } from 'react';
import { generateFinancialAnalysis } from '@/app/actions/ai-report';
import { Loader2, Sparkles, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

type DashboardData = {
    globalStats: { totalExpenses: number; totalIncome: number; netProfit: number };
    categoryStats: Record<string, number>;
    incomeCategoryStats: Record<string, number>;
    landStats: { name: string; expenses: number; income: number; profit: number; cropName: string }[];
};

export default function FinancialAnalysis({ data }: { data: DashboardData }) {
    const [analysis, setAnalysis] = useState<{ general: string | null, crops: string | null }>({ general: null, crops: null });
    const [loading, setLoading] = useState<{ general: boolean, crops: boolean }>({ general: false, crops: false });
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const chartGlobalRef = useRef<HTMLDivElement>(null);
    const chartCategoriesRef = useRef<HTMLDivElement>(null);
    const chartIncomeCategoriesRef = useRef<HTMLDivElement>(null);
    const chartCropsRef = useRef<HTMLDivElement>(null);

    const handleAnalyzeGeneral = async () => {
        setLoading(prev => ({ ...prev, general: true }));
        try {
            const context = `Analiza este resumen financiero de AgroGasto: Ingresos S/ ${data.globalStats.totalIncome.toLocaleString('es-PE')}, Gastos S/ ${data.globalStats.totalExpenses.toLocaleString('es-PE')}, Ganancia S/ ${data.globalStats.netProfit.toLocaleString('es-PE')}. Provee una conclusión general sobre la salud financiera.`;
            const result = await generateFinancialAnalysis(context);
            if (result.success && result.analysis) {
                setAnalysis(prev => ({ ...prev, general: result.analysis }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(prev => ({ ...prev, general: false }));
        }
    };

    const handleAnalyzeCrops = async () => {
        setLoading(prev => ({ ...prev, crops: true }));
        try {
            const cropsContext = data.landStats.map(s => `${s.name}: Ingresos S/ ${s.income.toLocaleString('es-PE')}, Gastos S/ ${s.expenses.toLocaleString('es-PE')}, Ganancia S/ ${s.profit.toLocaleString('es-PE')}`).join('; ');
            const context = `Analiza el rendimiento de cada cultivo individualmente basado en estos datos: ${cropsContext}. Indica qué cultivos son más rentables y cuáles tienen problemas.`;
            const result = await generateFinancialAnalysis(context);
            if (result.success && result.analysis) {
                setAnalysis(prev => ({ ...prev, crops: result.analysis }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(prev => ({ ...prev, crops: false }));
        }
    };

    const generatePDF = async () => {
        setGeneratingPdf(true);
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let y = 20;

            // Cover Header
            doc.setFillColor(5, 150, 105);
            doc.rect(0, 0, pageWidth, 20, 'F');
            doc.setFontSize(18);
            doc.setTextColor(255, 255, 255);
            doc.text("AgroGasto - Análisis Financiero", 10, 13);

            y += 20;

            // --- 1. Resúmenes Visuales (Gráficos) ---
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text("1. Resumen Visual", 14, y);
            y += 10;

            if (chartGlobalRef.current) {
                const canvas = await html2canvas(chartGlobalRef.current);
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = (pageWidth - 28) / 2;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                doc.addImage(imgData, 'PNG', 14, y, imgWidth, imgHeight);

                // Add second chart side by side or below? Side by side fits.
                if (chartCategoriesRef.current) {
                    const canvas2 = await html2canvas(chartCategoriesRef.current);
                    const imgData2 = canvas2.toDataURL('image/png');
                    doc.addImage(imgData2, 'PNG', 14 + imgWidth + 5, y, imgWidth, imgHeight);
                }

                y += imgHeight + 10;
            }

            // --- 2. Análisis General ---
            if (y > pageHeight - 60) { doc.addPage(); y = 20; }

            doc.setFontSize(14);
            doc.setTextColor(5, 150, 105);
            doc.text("2. Análisis General (IA)", 14, y);
            y += 8;

            if (analysis.general) {
                doc.setFontSize(10);
                doc.setTextColor(0);
                const splitText = doc.splitTextToSize(analysis.general, pageWidth - 28);
                doc.text(splitText, 14, y);
                y += (splitText.length * 5) + 10;
            } else {
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text("(No generado)", 14, y);
                y += 10;
            }

            // --- 3. Análisis por Cultivo ---
            if (y > pageHeight - 60) { doc.addPage(); y = 20; }

            doc.setFontSize(14);
            doc.setTextColor(5, 150, 105);
            doc.text("3. Análisis por Cultivo (IA)", 14, y);
            y += 8;

            if (analysis.crops) {
                doc.setFontSize(10);
                doc.setTextColor(0);
                const splitText = doc.splitTextToSize(analysis.crops, pageWidth - 28);
                doc.text(splitText, 14, y);
            } else {
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text("(No generado)", 14, y);
            }

            doc.save(`Reporte_Financiero_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error('PDF Error:', error);
            alert('Error generando PDF');
        } finally {
            setGeneratingPdf(false);
        }
    };

    // Prepare chart data
    const categoryChartData = Object.entries(data.categoryStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const incomeCategoryChartData = Object.entries(data.incomeCategoryStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-8">
            {/* Header / PDF Export Area */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Panel de Resultados</h2>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Visualiza el estado de tu negocio y genera reportes inteligentes.
                        Genera los análisis de IA abajo para incluirlos en el PDF.
                    </p>
                </div>
                <button
                    onClick={generatePDF}
                    disabled={generatingPdf}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl shadow hover:shadow-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium"
                >
                    {generatingPdf ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                    <span>Descargar Reporte PDF</span>
                </button>
            </div>

            {/* Visual Charts Section (Purely Visual) */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Chart 1: Global Balance */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Balance General</h3>
                    <div ref={chartGlobalRef} className="bg-white">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={[data.globalStats]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={false} />
                                <YAxis />
                                <Tooltip formatter={(val: number) => `S/ ${val.toLocaleString('es-PE')}`} />
                                <Bar dataKey="totalIncome" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="totalExpenses" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="netProfit" name="Ganancia" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Expense Categories */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Gastos por Categoría</h3>
                    <div ref={chartCategoriesRef} className="bg-white flex justify-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={categoryChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val: number) => `S/ ${val.toLocaleString('es-PE')}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 3: Income Categories */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Ingresos por Categoría</h3>
                    <div ref={chartIncomeCategoriesRef} className="bg-white flex justify-center">
                        {incomeCategoryChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={incomeCategoryChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {incomeCategoryChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val: number) => `S/ ${val.toLocaleString('es-PE')}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-gray-400">No hay ingresos registrados</div>
                        )}
                    </div>
                </div>

                {/* Chart 4: Profitability by Crop */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Rentabilidad por Cultivo</h3>
                    <div ref={chartCropsRef} className="bg-white">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data.landStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="cropName" />
                                <YAxis />
                                <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
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

            {/* AI Analysis Section */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* 1. General Analysis */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <Sparkles size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">1. Análisis General IA</h3>
                        </div>
                        <button
                            onClick={handleAnalyzeGeneral}
                            disabled={loading.general}
                            className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium disabled:opacity-50"
                        >
                            {loading.general ? 'Analizando...' : (analysis.general ? 'Regenerar' : 'Generar Análisis')}
                        </button>
                    </div>

                    <div className="flex-grow bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm leading-relaxed text-slate-700">
                        {analysis.general ? (
                            <p className="whitespace-pre-wrap">{analysis.general}</p>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                                <Sparkles size={32} className="mb-2 opacity-20" />
                                <p>Presiona "Generar Análisis" para obtener una lectura inteligente de tus finanzas globales.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Crop Analysis */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                                <Sparkles size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">2. Análisis por Cultivo IA</h3>
                        </div>
                        <button
                            onClick={handleAnalyzeCrops}
                            disabled={loading.crops}
                            className="text-sm bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition font-medium disabled:opacity-50"
                        >
                            {loading.crops ? 'Analizando...' : (analysis.crops ? 'Regenerar' : 'Generar Análisis')}
                        </button>
                    </div>

                    <div className="flex-grow bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm leading-relaxed text-slate-700">
                        {analysis.crops ? (
                            <p className="whitespace-pre-wrap">{analysis.crops}</p>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                                <Sparkles size={32} className="mb-2 opacity-20" />
                                <p>Obtén un desglose detallado del rendimiento y rentabilidad de cada uno de tus cultivos.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
