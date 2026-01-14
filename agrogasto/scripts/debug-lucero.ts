
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load envs
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const prisma = new PrismaClient();
const targetEmail = 'Luceritonicol05@gmail.com';
const targetUID = '34c6bd64-f188-4cb8-84f1c35a81b3';

async function main() {
    console.log(`🔍 Diagnosing user: ${targetEmail}`);

    // 1. Check Supabase Auth
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) console.error('Auth Error:', error);

    const authUser = users?.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());

    if (authUser) {
        console.log(`✅ Auth User Found: ${authUser.id}`);
        console.log('   Metadata:', authUser.user_metadata);

        // Clean Metadata as requested
        console.log('🧹 Cleaning Auth Metadata (removing specific role persistence if any)...');
        // We actually want the DB to drive the role. 
        // Logic: app checks DB -> syncs to Auth. 
        // If we wipe Auth metadata, the next login/sync will restore it from DB. 
        // This is good to "reset" it.
        await supabase.auth.admin.updateUserById(authUser.id, {
            user_metadata: { ...authUser.user_metadata, role: null }
        });
        console.log('   Metadata roles cleared.');
    } else {
        console.log('❌ Auth User NOT found.');
    }

    // 2. Check Prisma DB
    const dbUsers = await prisma.user.findMany({
        where: { email: { contains: 'lucero', mode: 'insensitive' } }
    });

    console.log(`\n📂 Database Records Found: ${dbUsers.length}`);
    for (const u of dbUsers) {
        console.log(`   ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | PwdHash: ${u.password?.substring(0, 10)}...`);

        // Check for duplicates
        if (u.email.toLowerCase() === targetEmail.toLowerCase()) {
            console.log('   -> Exact match.');
            // Verify encryption
            if (!u.password || !u.password.startsWith('$2')) {
                console.warn('   ⚠️  WARNING: Password might not be bcrypt hashed!');
            } else {
                console.log('   🔒 Password appears to be bcrypt hash.');
            }
        }
    }

    // 3. Remove non-matching if logic implies duplicates (though schema likely prevents it)
    // If we found multiple users with similar emails, we leave them unless exact duplicate.
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
