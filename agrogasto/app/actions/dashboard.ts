'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardData() {
    // Aggregate data from active seasons
    const seasons = await prisma.season.findMany({
        where: { isActive: true },
        include: {
            land: true,
            expenses: { where: { isVoided: false } },
            incomes: { where: { isVoided: false } }
        }
    });

    const landStats = seasons.map(s => {
        const expenses = s.expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const income = s.incomes.reduce((acc, curr) => acc + curr.totalPrice, 0);
        return {
            name: s.land.name,
            expenses,
            income,
            profit: income - expenses,
            cropName: s.land.name + ' - ' + (s.expenses[0]?.category || 'Unknown') // Placeholder logic for crop context if needed, but season has cropId usually
        };
    });

    const globalStats = {
        totalExpenses: landStats.reduce((acc, curr) => acc + curr.expenses, 0),
        totalIncome: landStats.reduce((acc, curr) => acc + curr.income, 0),
        netProfit: landStats.reduce((acc, curr) => acc + curr.profit, 0)
    };

    // Also get category breakdown for charts
    const allExpenses = seasons.flatMap(s => s.expenses);
    const categoryStats: Record<string, number> = {};
    allExpenses.forEach(e => {
        categoryStats[e.category] = (categoryStats[e.category] || 0) + e.amount;
    });

    // Income category breakdown
    const allIncomes = seasons.flatMap(s => s.incomes);
    const incomeCategoryStats: Record<string, number> = {};
    allIncomes.forEach(i => {
        const cat = i.category || 'Sin Categoría';
        incomeCategoryStats[cat] = (incomeCategoryStats[cat] || 0) + i.totalPrice;
    });

    return { landStats, globalStats, categoryStats, incomeCategoryStats };
}
