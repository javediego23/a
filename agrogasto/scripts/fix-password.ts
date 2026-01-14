
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const prisma = new PrismaClient();

async function main() {
    console.log('🔐 Setting password for main user...');

    // Find user by email part
    const user = await prisma.user.findFirst({
        where: { email: { contains: 'javediego' } } // Matches javediego.4@hotmail.com etc
    });

    if (!user) {
        console.error('❌ User not found!');
        return;
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`);

    // Hash password 'jave2000'
    const hashedPassword = await bcrypt.hash('jave2000', 10);

    // Update
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            role: 'OWNER' // Ensure they are OWNER while we are here
        }
    });

    console.log('✅ Password updated to "jave2000" and role confirmed as OWNER.');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
