'use server';

import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function getCurrentUserName() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Check Supabase metadata first (fastest/most direct from session)
    if (user.user_metadata?.name) {
        return user.user_metadata.name;
    }

    // Fallback to DB
    // @ts-ignore: Stale Prisma Client workaround
    const dbUser: any = await prisma.user.findUnique({
        where: { email: user.email },
    });

    return dbUser?.name || dbUser?.username || user.email?.split('@')[0] || 'Usuario';
}
