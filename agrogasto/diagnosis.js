const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DB DIAGNOSIS START ---');
    try {
        // 1. Count Total Expenses
        const total = await prisma.expense.count();
        console.log('Total Expenses in DB:', total);

        // 2. Count Voided vs Active
        const voided = await prisma.expense.count({ where: { isVoided: true } });
        const active = await prisma.expense.count({ where: { isVoided: false } });
        console.log(`Active: ${active}, Voided: ${voided}`);

        // 3. Dump First 5 Active Expenses
        if (active > 0) {
            const expenses = await prisma.expense.findMany({
                where: { isVoided: false },
                take: 5,
                include: { season: true }
            });
            console.log('First 5 Active Expenses:');
            console.log(JSON.stringify(expenses, null, 2));
        } else {
            console.warn('⚠️ NO ACTIVE EXPENSES FOUND. This explains why the table is empty.');
        }

    } catch (e) {
        console.error('Query Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
