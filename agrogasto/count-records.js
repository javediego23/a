const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const crops = await prisma.crop.count();
        const lands = await prisma.land.count();
        const seasons = await prisma.season.count();
        const expenses = await prisma.expense.count();
        const incomes = await prisma.income.count();

        console.log('--- DB COUNTS ---');
        console.log(`Crops: ${crops}`);
        console.log(`Lands: ${lands}`);
        console.log(`Seasons: ${seasons}`);
        console.log(`Expenses: ${expenses}`);
        console.log(`Incomes: ${incomes}`);
        console.log('-----------------');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
