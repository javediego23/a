'use server';

import { prisma } from '@/lib/prisma';

export type Anomaly = {
    type: 'category' | 'total';
    severity: 'low' | 'medium' | 'high';
    message: string;
};

export async function detectAnomalies(seasonId: number): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    const currentSeason = await prisma.season.findUnique({
        where: { id: seasonId },
        include: { expenses: { where: { isVoided: false } } },
    });

    if (!currentSeason) return [];

    // 1. Fetch historical seasons for same Land + Crop
    const history = await prisma.season.findMany({
        where: {
            landId: currentSeason.landId,
            cropId: currentSeason.cropId,
            isActive: false, // Only closed seasons
            id: { not: seasonId }, // Exclude current
        },
        include: { expenses: { where: { isVoided: false } } },
    });

    if (history.length === 0) return []; // No history to compare

    // 2. Analyze by Category
    const currentByCategory: Record<string, number> = {};
    currentSeason.expenses.forEach((e: { category: string; amount: number }) => {
        currentByCategory[e.category] = (currentByCategory[e.category] || 0) + e.amount;
    });

    const historyByCategory: Record<string, number[]> = {};
    history.forEach((h: { expenses: { category: string; amount: number }[] }) => {
        // Aggregate this historical season's category totals
        const seasonCats: Record<string, number> = {};
        h.expenses.forEach((e: { category: string; amount: number }) => {
            seasonCats[e.category] = (seasonCats[e.category] || 0) + e.amount;
        });
        Object.entries(seasonCats).forEach(([cat, amount]) => {
            if (!historyByCategory[cat]) historyByCategory[cat] = [];
            historyByCategory[cat].push(amount as number);
        });
    });

    // Compare
    Object.entries(currentByCategory).forEach(([cat, amount]) => {
        const historicalValues = historyByCategory[cat] || [];
        if (historicalValues.length === 0) return;

        const avg = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
        // Simple deviation check: > 30% above average
        if (amount > avg * 1.3) {
            anomalies.push({
                type: 'category',
                severity: amount > avg * 1.5 ? 'high' : 'medium',
                message: `El gasto en '${cat}' (S/ ${amount.toLocaleString('es-PE')}) supera el promedio histórico (S/ ${avg.toLocaleString('es-PE')}) en más del 30%.`,
            });
        }
    });

    return anomalies;
}
