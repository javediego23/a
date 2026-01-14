
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const prisma = new PrismaClient();
const email = 'Luceritonicol05@gmail.com';

async function main() {
    console.log(`🛠️  Restoring DB Record for: ${email}`);

    // Check if exists (should be 0 based on prev log)
    const existing = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } }
    });

    if (existing) {
        console.log('⚠️  User actually exists now? ID:', existing.id);
        // Just update just in case
        await prisma.user.update({
            where: { id: existing.id },
            data: { role: 'OWNER' }
        });
        console.log('   Updated role to OWNER.');
    } else {
        console.log('➕ Creating missing DB record...');
        const hashedPassword = await bcrypt.hash('lucero2025', 10); // Default temp password
        await prisma.user.create({
            data: {
                email: email,
                name: 'Lucero Castillo',
                role: 'OWNER', // Force Owner as requested
                password: hashedPassword
            }
        });
        console.log('✅ User created in DB with role OWNER.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
