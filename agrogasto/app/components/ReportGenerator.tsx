'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateFinancialAnalysis } from '@/app/actions/ai-report';
import { FileText, Loader2, Sparkles } from 'lucide-react';

export default function ReportGenerator() {
    const [loading, setLoading] = useState(false);

    const generatePDF = async () => {
        setLoading(true);
        try {
            // 1. Fetch AI Analysis
            const aiResult = await generateFinancialAnalysis();
            const analysisText = aiResult.success ? aiResult.analysis : "No se pudo generar el análisis.";

            // 2. Initialize PDF
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // --- Cover Page ---
            doc.setFillColor(5, 150, 105); // Green primary
            doc.rect(0, 0, pageWidth, 20, 'F'); // Top bar

            doc.setFontSize(26);
            doc.setTextColor(5, 150, 105);
            doc.text("Reporte Financiero", pageWidth / 2, 80, { align: 'center' });
            doc.setFontSize(18);
            doc.setTextColor(80, 80, 80);
            doc.text("AgroGasto", pageWidth / 2, 95, { align: 'center' });

            doc.setFontSize(12);
            doc.text(`Generado: ${new Date().toLocaleDateString()}`, pageWidth / 2, 110, { align: 'center' });

            // Add simple decorative elements
            doc.setDrawColor(5, 150, 105);
            doc.line(40, 120, pageWidth - 40, 120);

            doc.setFillColor(5, 150, 105);
            doc.rect(0, doc.internal.pageSize.getHeight() - 20, pageWidth, 20, 'F'); // Bottom bar

            doc.addPage();

            // --- Analysis Page ---
            doc.setFontSize(16);
            doc.setTextColor(5, 150, 105);
            doc.text("Resumen Ejecutivo & Análisis IA", 14, 20);

            // Add AI Analysis Text with handling for long text
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            const splitText = doc.splitTextToSize(analysisText || '', pageWidth - 28);
            doc.text(splitText, 14, 30);

            // Placeholder for tables (To be populated with real data passed as props if needed, 
            // but for this component we assume the server action might return data or we reuse passed props.
            // For now, focusing on the AI textual part as requested.)

            // NOTE: In a full implementation, we'd pass the same 'expenses' and 'incomes' data to this component
            // to render the tables into the PDF using autoTable.
            // For this phase, we'll assume the AI summary is the key value add.

            doc.save(`Reporte_AgroGasto_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error(error);
            alert("Error al generar el PDF");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={generatePDF}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-lg shadow hover:from-emerald-700 hover:to-emerald-800 transition-all"
        >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
            <span>{loading ? 'Generando Reporte...' : 'Descargar Reporte IA'}</span>
            {!loading && <Sparkles size={16} className="text-yellow-300" />}
        </button>
    );
}
