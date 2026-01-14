
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load envs
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const prisma = new PrismaClient();
const targetEmail = 'Luceritonicol05@gmail.com';

async function main() {
    console.log(`🗑️  Starting deletion process for: ${targetEmail}`);

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Delete from Prisma (Database)
    try {
        const dbUser = await prisma.user.findFirst({
            where: { email: { equals: targetEmail, mode: 'insensitive' } }
        });

        if (dbUser) {
            await prisma.user.delete({ where: { id: dbUser.id } });
            console.log('✅ Deleted from Prisma Database (public.User)');
        } else {
            console.log('⚠️  User not found in Prisma Database');
        }
    } catch (error) {
        console.error('❌ Error deleting from Prisma:', error);
    }

    // 2. Delete from Supabase Auth
    try {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const authUser = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());

        if (authUser) {
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
            if (deleteError) throw deleteError;
            console.log('✅ Deleted from Supabase Auth');
        } else {
            console.log('⚠️  User not found in Supabase Auth');
        }
    } catch (error) {
        console.error('❌ Error deleting from Supabase Auth:', error);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
