'use server';

import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function syncUserRole() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'No user' };

    // 1. Get Real Role from DB
    // @ts-ignore
    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
    });

    if (!dbUser) return { success: false, error: 'User not in DB' };

    const dbRole = dbUser.role;
    const authRole = user.user_metadata?.role;

    // 2. Compare with Session Metadata
    if (dbRole !== authRole) {
        console.log(`[Sync] Mismatch detected for ${user.email}. DB: ${dbRole}, Auth: ${authRole}. Syncing...`);

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.error('[Sync] Missing SUPABASE_SERVICE_ROLE_KEY');
            return { success: false, error: 'Server config error' };
        }

        const adminAuth = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { error } = await adminAuth.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, role: dbRole }
        });

        if (error) {
            console.error('[Sync] Update failed:', error);
            return { success: false, error: error.message };
        }

        return { success: true, updated: true, newRole: dbRole };
    }

    return { success: true, updated: false, currentRole: authRole };
}
