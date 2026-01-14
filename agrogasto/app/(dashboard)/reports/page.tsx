import FinancialAnalysis from "@/app/components/FinancialAnalysis";
import { getDashboardData } from "@/app/actions/dashboard";
import { FileText } from "lucide-react";

export default async function ReportsPage() {
    const data = await getDashboardData();

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <FileText className="text-emerald-600" size={32} />
                    Análisis Financiero & Reportes
                </h1>
                <p className="text-gray-500 mt-2">
                    Genera explicaciones detalladas para cada gráfica y descarga el reporte completo.
                </p>
            </header>

            <FinancialAnalysis data={data} />
        </div>
    );
}
