import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const seasonId = parseInt(id);

    const season = await prisma.season.findUnique({
        where: { id: seasonId },
        include: {
            land: true,
            crop: true,
            expenses: { where: { isVoided: false } },
            incomes: { where: { isVoided: false } },
        },
    });

    if (!season) return new NextResponse('Not Found', { status: 404 });

    // Prepare Data
    const expensesData = season.expenses.map((e: any) => ({
        Fecha: e.date.toISOString().split('T')[0],
        Categoria: e.category,
        Monto: e.amount,
        Unidad: e.unit,
        Nota: e.note || '',
    }));

    const incomeData = season.incomes.map((i: any) => ({
        Fecha: i.date.toISOString().split('T')[0],
        Tipo: i.isEstimated ? 'Estimado' : 'Real',
        Cantidad: i.quantity,
        Unidad: i.unit,
        PrecioUnitario: i.unitPrice,
        Total: i.totalPrice,
    }));

    const summaryData = [{
        Terreno: season.land.name,
        Cultivo: season.crop.name,
        Inicio: season.startDate.toISOString().split('T')[0],
        Fin: season.endDate ? season.endDate.toISOString().split('T')[0] : 'En Curso',
        TotalGastos: season.expenses.reduce((a: number, b: { amount: number }) => a + b.amount, 0),
        TotalIngresos: season.incomes.reduce((a: number, b: { totalPrice: number }) => a + b.totalPrice, 0),
    }];

    // Create Workbook
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
    const wsIncome = XLSX.utils.json_to_sheet(incomeData);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Gastos');
    XLSX.utils.book_append_sheet(wb, wsIncome, 'Ingresos');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
        headers: {
            'Content-Disposition': `attachment; filename="Reporte_Temporada_${seasonId}.xlsx"`,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
    });
}
