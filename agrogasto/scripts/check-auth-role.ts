
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from root .env and .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const TARGET_EMAIL = 'javediego.4@hotmail.com';

async function main() {
    console.log(`Checking Auth Metadata for ${TARGET_EMAIL}...`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing Supabase credentials.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }

    const user = users.find(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());

    if (user) {
        console.log('--- USER FOUND ---');
        console.log('ID:', user.id);
        console.log('Email:', user.email);
        console.log('Metadata:', JSON.stringify(user.user_metadata, null, 2));
        console.log('Role Map (App metadata):', JSON.stringify(user.app_metadata, null, 2));

        if (user.user_metadata?.role === 'OWNER') {
            console.log('✅ Result: User HAS OWNER role in metadata.');
        } else {
            console.log('❌ Result: User DOES NOT have OWNER role.');
        }
    } else {
        console.error('User not found!');
    }
}

main();
