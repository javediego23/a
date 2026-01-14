import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function getUserRole() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
    });
    return dbUser?.role;
}

export async function canEdit() {
    const role = await getUserRole();
    return role === 'OWNER' || role === 'EDITOR';
}

export async function canManageUsers() {
    const role = await getUserRole();
    return role === 'OWNER';
}
