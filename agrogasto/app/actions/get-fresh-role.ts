'use server';

import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function getFreshUserRole() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 'VIEWER'; // Default safe

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
    });

    // Default to VIEWER if not found, otherwise return actual role
    return dbUser?.role || 'VIEWER';
}
