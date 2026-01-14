import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create/Update Admin User
    const password = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'javediego.4@hotmail.com' },
        update: { role: 'OWNER' },
        create: {
            username: 'admin',
            email: 'javediego.4@hotmail.com',
            password,
            role: 'OWNER',
        },
    });
    console.log(`👤 User ensured: ${user.email}`);

    // 2. Seed Units
    const units = [
        { name: 'Kilogramos', symbol: 'kg', usage: 'BOTH' },
        { name: 'Litros', symbol: 'L', usage: 'BOTH' },
        { name: 'Unidad', symbol: 'un', usage: 'BOTH' },
        { name: 'Saco/Bolsa', symbol: 'scy', usage: 'BOTH' },
        { name: 'Hectárea', symbol: 'ha', usage: 'BOTH' },
        { name: 'Metros Cúbicos', symbol: 'm3', usage: 'BOTH' },
        { name: 'Jornal', symbol: 'jor', usage: 'EXPENSE' },
        { name: 'Horas', symbol: 'hr', usage: 'EXPENSE' },
        { name: 'Tonelada', symbol: 'ton', usage: 'INCOME' },
    ] as const;

    for (const u of units) {
        await prisma.unit.upsert({
            where: { symbol: u.symbol },
            update: { name: u.name, usage: u.usage as any },
            create: { name: u.name, symbol: u.symbol, usage: u.usage as any },
        });
    }
    console.log(`📏 Units seeded: ${units.length}`);

    // 3. Create Sample Data (Land, Crop, Season)
    const land = await prisma.land.create({
        data: {
            name: 'Parcela Demo',
            location: 'Sector El Valle',
            area: 5,
            areaUnit: 'ha',
            type: 'OWNED'
        }
    });

    const crop = await prisma.crop.create({
        data: { name: 'Maíz Híbrido' }
    });

    const season = await prisma.season.create({
        data: {
            landId: land.id,
            cropId: crop.id,
            startDate: new Date(),
            isActive: true
        }
    });
    console.log(`🌾 Created Season: ${crop.name} at ${land.name}`);

    // 4. Create Sample Expenses
    await prisma.expense.createMany({
        data: [
            {
                seasonId: season.id,
                date: new Date(),
                category: 'Semillas',
                amount: 1500,
                quantity: 10,
                unit: 'scy',
                note: 'Semilla Certificada - Inicio de campaña'
            },
            {
                seasonId: season.id,
                date: new Date(),
                category: 'Fertilizantes',
                amount: 850,
                quantity: 15,
                unit: 'scy',
                note: 'Urea primera aplicación'
            },
            {
                seasonId: season.id,
                date: new Date(),
                category: 'Mano de Obra',
                amount: 300,
                quantity: 5,
                unit: 'jor',
                note: 'Limpieza de terreno'
            }
        ]
    });
    console.log('💸 Sample expenses created');

    // 5. Create Sample Income (Estimated)
    await prisma.income.create({
        data: {
            seasonId: season.id,
            date: new Date(new Date().setMonth(new Date().getMonth() + 4)), // Future date
            category: 'Venta Cosecha',
            quantity: 40,
            unit: 'ton',
            unitPrice: 900,
            totalPrice: 36000,
            isEstimated: true,
            isVoided: false
        }
    });
    console.log('💰 Sample income created');

    console.log('✅ Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
