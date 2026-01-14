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

import { createClient as createSupabaseClient } from '@supabase/supabase-js'; // Direct client for admin

// ... existing imports

export async function addUser(email: string, role: string, name: string | null, password?: string) {
    const isOwner = await checkOwner();
    if (!isOwner) return { success: false, error: 'Acceso denegado' };

    // 1. Validation
    if (password && password.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    try {
        // 2. Supabase Auth Sync
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.error("SUPABASE_SERVICE_ROLE_KEY is missing!");
            return { success: false, error: 'Configuración del servidor incompleta (Falta Key).' };
        }

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password || 'tempPass123!', // Provide a default if generic
            email_confirm: true, // [UPDATED] Bypass Email Confirmation
            user_metadata: { name: name }
        });

        if (authError) {
            console.error("Supabase Auth Error:", authError);
            if (authError.message.includes('already registered') || authError.status === 422) {
                // User might already exist in Auth but not DB? Or just collision.
                // We should probably proceed to check DB or return specific error.
                // If they exist in Auth, we can try to link/create in DB anyway if missing.
                console.log("User already in Auth, checking DB...");
            } else {
                return { success: false, error: `Error de Auth: ${authError.message}` };
            }
        }

        // 3. Create/Update user in DB (Prisma)
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
                // store auth_id if needed? usually good practice but schema might not have it
            } as any,
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        // If Prisma fails (e.g. unique constraint on email in DB)
        if (error.code === 'P2002') {
            return { success: false, error: 'El usuario ya existe en la base de datos.' };
        }
        console.error("DB Error:", error);
        return { success: false, error: 'Error al agregar usuario.' };
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
