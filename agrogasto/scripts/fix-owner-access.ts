
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from root .env and .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const prisma = new PrismaClient();

const TARGET_EMAIL = 'javediego.4@hotmail.com';
const TARGET_ROLE = 'OWNER';

async function main() {
    console.log(`Starting fix for ${TARGET_EMAIL}...`);

    // 1. Supabase Auth Update
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing Supabase credentials in .env');
        console.log('Available Config Keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('URL')));
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('Searching user in Supabase Auth...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        process.exit(1);
    }

    const authUser = users.find(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());

    if (authUser) {
        console.log(`Found Auth User: ${authUser.id}. Updating role to ${TARGET_ROLE}...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
            user_metadata: { ...authUser.user_metadata, role: TARGET_ROLE }
        });

        if (updateError) {
            console.error('Failed to update Auth role:', updateError);
        } else {
            console.log('Supabase Auth role updated successfully.');
        }
    } else {
        console.warn('User NOT found in Supabase Auth! You may need to sign up first or check the email.');
    }

    // 2. Prisma DB Update
    console.log('Updating user in Prisma Database...');
    try {
        const user = await prisma.user.upsert({
            where: { email: TARGET_EMAIL } as any,
            update: { role: TARGET_ROLE },
            create: {
                email: TARGET_EMAIL,
                role: TARGET_ROLE,
                username: TARGET_EMAIL.split('@')[0],
                name: 'Jave Diego' // Default name if creating
            } as any,
        });
        console.log(`Database user updated: ${user.email} is now ${user.role}`);
    } catch (dbError) {
        console.error('Error updating Database:', dbError);
    }

    console.log('Done.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
