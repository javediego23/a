import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient(); // Try empty

async function main() {
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
    console.log({ user });
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
