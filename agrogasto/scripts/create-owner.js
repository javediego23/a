
require('dotenv').config({ path: '.env.local' }); // Load from .env.local where keys are
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const prisma = new PrismaClient();
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const email = 'javediego.4@hotmail.com';
    const password = 'jave2000';

    console.log(`Creating user: ${email}...`);

    // 1. Create in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('Supabase Auth Error:', error.message);
        // If user already exists, we continue to ensure DB role is correct
    } else {
        console.log('Supabase Auth User Created/Found:', data.user?.id);
    }

    // 2. Create/Update in Database with Owner Role
    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { role: 'OWNER' },
            create: {
                email,
                role: 'OWNER',
                username: 'javediego', // Default
            },
        });
        console.log('Database User Synced:', user);
    } catch (e) {
        console.error('Prisma Error:', e);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
