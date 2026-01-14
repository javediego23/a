const { getAllExpenses } = require('./app/actions/transaction');
// Mock Prisma client if needed, or rely on normal runtime if ts-node works, 
// BUT server actions are tricky to run in standalone node scripts without Next.js context sometimes.
// Better to simple query prisma directly with the SAME query as the action.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- TESTING QUERY LOGIC ---');
    const expenses = await prisma.expense.findMany({
        where: { isVoided: false },
        take: 50,
        orderBy: { date: 'desc' },
        include: {
            season: {
                include: {
                    land: true,
                    crop: true,
                },
            },
        },
    });
    console.log('Count:', expenses.length);
    if (expenses.length > 0) {
        console.log('First Record:', expenses[0]);
    } else {
        console.log('No records found with isVoided: false');
    }

    const all = await prisma.expense.count();
    console.log('Total Absolute Count:', all);
}

main();
