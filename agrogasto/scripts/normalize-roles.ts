
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting Role Normalization...');

    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        let newRole = user.role;
        let needsUpdate = false;

        // Map English variations or Spanish terms to strict Enums
        const roleUpper = user.role.toUpperCase();

        if (roleUpper === 'DUEÑO' || roleUpper === 'DUENO' || roleUpper === 'ADMIN' || roleUpper === 'ADMINISTRADOR') {
            newRole = 'OWNER';
            needsUpdate = true;
        } else if (roleUpper === 'VISUALIZADOR' || roleUpper === 'ESPECTADOR' || roleUpper === 'GUEST') {
            newRole = 'VIEWER';
            needsUpdate = true;
        } else if (roleUpper === 'ENCARGADO' || roleUpper === 'EDIT') {
            newRole = 'EDITOR';
            needsUpdate = true;
        }

        if (needsUpdate || !['OWNER', 'EDITOR', 'VIEWER'].includes(newRole)) {
            console.log(`🔄 Normalizing user ${user.email}: '${user.role}' -> '${newRole}'`);
            await prisma.user.update({
                where: { id: user.id },
                data: { role: newRole }
            });
        }
    }

    // Verify Jave Diego
    const owner = await prisma.user.findFirst({ where: { email: { contains: 'javediego' } } });
    if (owner && owner.role !== 'OWNER') {
        console.log('⚠️ Warning: Main user is not OWNER. Fixing...');
        await prisma.user.update({
            where: { id: owner.id },
            data: { role: 'OWNER' }
        });
    }

    console.log('✅ Roles normalized.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
