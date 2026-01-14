const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING WIPE & SEED ---');
    try {
        // 1. Wipe all data (Order matters due to foreign keys)
        await prisma.income.deleteMany({});
        await prisma.expense.deleteMany({});
        await prisma.season.deleteMany({});
        await prisma.crop.deleteMany({});
        await prisma.land.deleteMany({});

        console.log('✅ Database Wiped (Clean Slate)');

        // 2. Seed Data to Verify Logic
        console.log('... Verifying Backend Logic ...');

        // Create Land
        const land = await prisma.land.create({
            data: { name: 'Terreno Test 1', location: 'Sur', type: 'OWNED' }
        });
        console.log('✅ Created Land:', land.id);

        // Create Crop
        const crop = await prisma.crop.create({
            data: { name: 'Maiz Test' }
        });
        console.log('✅ Created Crop:', crop.id);

        // Create Season
        const season = await prisma.season.create({
            data: {
                landId: land.id,
                cropId: crop.id,
                startDate: new Date(),
                isActive: true
            }
        });
        console.log('✅ Created Season:', season.id);

        // Create Expense
        const expense = await prisma.expense.create({
            data: {
                seasonId: season.id,
                date: new Date(),
                amount: 150.50,
                category: 'Semillas',
                unit: 'kg',
                note: 'Gasto de prueba backend'
            }
        });
        console.log('✅ Created Expense:', expense.id);

        // Verify Fetch
        const count = await prisma.expense.count();
        console.log('✅ Total Expenses in DB:', count);

    } catch (e) {
        console.error('❌ ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
