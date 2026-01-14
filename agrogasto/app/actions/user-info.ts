'use server';

import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function getCurrentUserName() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // @ts-ignore: Stale Prisma Client workaround
    const dbUser: any = await prisma.user.findUnique({
        where: { email: user.email },
    });

    return dbUser?.name || dbUser?.username || 'Usuario';
}
