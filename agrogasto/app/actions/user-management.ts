'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

async function checkOwner() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check DB role
    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
    });

    return dbUser?.role === 'OWNER';
}

export async function getUsers() {
    const isOwner = await checkOwner();
    if (!isOwner) return { success: false, error: 'Acceso denegado' };

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, role: true, username: true, createdAt: true },
        });
        return { success: true, data: users };
    } catch (error) {
        return { success: false, error: 'Error al obtener usuarios' };
    }
}

export async function addUser(email: string, role: string) {
    const isOwner = await checkOwner();
    if (!isOwner) return { success: false, error: 'Acceso denegado' };

    try {
        // Create user in DB so when they sign up, they have this role
        await prisma.user.create({
            data: {
                email,
                role,
                username: email.split('@')[0], // Default username
            },
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al agregar usuario. Puede que ya exista.' };
    }
}

export async function updateUserRole(email: string, newRole: string) {
    const isOwner = await checkOwner();
    if (!isOwner) return { success: false, error: 'Acceso denegado' };

    try {
        await prisma.user.update({
            where: { email },
            data: { role: newRole },
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al actualizar rol' };
    }
}

export async function deleteUser(email: string) {
    const isOwner = await checkOwner();
    if (!isOwner) return { success: false, error: 'Acceso denegado' };

    try {
        await prisma.user.delete({
            where: { email },
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al eliminar usuario' };
    }
}
