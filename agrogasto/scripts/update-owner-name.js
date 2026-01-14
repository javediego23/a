
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'javediego.4@hotmail.com';
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { name: 'Diego Jave' },
        });
        console.log('User updated:', user);
    } catch (e) {
        console.error('Error updating user:', e);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
