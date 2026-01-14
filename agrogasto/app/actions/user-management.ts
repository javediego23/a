'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

async function checkOwner() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check DB role
    const dbUser = await prisma.user.findUnique({
        where: { email: user.email } as any,
    });

    return dbUser?.role === 'OWNER';
}

export async function getUsers() {
    const isOwner = await checkOwner();
    if (!isOwner) return { success: false, error: 'Acceso denegado' };

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        // @ts-ignore: Stale types
        return { success: true, data: users };
    } catch (error) {
        return { success: false, error: 'Error al obtener usuarios' };
    }
}

export async function addUser(email: string, role: string, name: string | null, password?: string) {
    const isOwner = await checkOwner();
    if (!isOwner) return { success: false, error: 'Acceso denegado' };

    try {
        // Create user in DB so when they sign up, they have this role
        // Note: Password is stored for reference/legacy but NOT used for Supabase login unless synced
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        // @ts-ignore: Stale Prisma Client workaround
        await prisma.user.create({
            data: {
                email,
                role,
                name: name || null,
                username: email.split('@')[0],
                password: hashedPassword,
            } as any,
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

export async function updateUser(email: string, data: { name?: string; password?: string; role?: string }) {
    const isOwner = await checkOwner();
    if (!isOwner) return { success: false, error: 'Acceso denegado' };

    try {
        const updateData: any = { ...data };
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        // @ts-ignore: Stale Prisma workaround
        await prisma.user.update({
            where: { email } as any,
            data: updateData,
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al actualizar usuario' };
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
