'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getLands() {
    try {
        const lands = await prisma.land.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { seasons: true }
                }
            }
        });
        return { success: true, data: lands };
    } catch (error) {
        return { success: false, error: 'Error al obtener terrenos' };
    }
}

export async function createLand(formData: FormData) {
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const type = formData.get('type') as string; // 'OWNED' | 'RENTED'
    const rentStartDateStr = formData.get('rentStartDate') as string;
    const rentEndDateStr = formData.get('rentEndDate') as string;

    if (!name) return { success: false, error: 'El nombre es obligatorio' };

    const rentStartDate = rentStartDateStr ? new Date(rentStartDateStr) : null;
    const rentEndDate = rentEndDateStr ? new Date(rentEndDateStr) : null;

    try {
        await prisma.land.create({
            data: { name, location, type, rentStartDate, rentEndDate },
        });
        revalidatePath('/lands');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al crear terreno' };
    }
}

export async function updateLand(id: number, formData: FormData) {
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const type = formData.get('type') as string;
    const rentStartDateStr = formData.get('rentStartDate') as string;
    const rentEndDateStr = formData.get('rentEndDate') as string;

    const rentStartDate = rentStartDateStr ? new Date(rentStartDateStr) : null;
    const rentEndDate = rentEndDateStr ? new Date(rentEndDateStr) : null;

    try {
        await prisma.land.update({
            where: { id },
            data: { name, location, type, rentStartDate, rentEndDate },
        });
        revalidatePath('/lands');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al actualizar terreno' };
    }
}

export async function deleteLand(id: number) {
    try {
        // Check for dependencies (Expenses/Incomes in any season of this land)
        const hasDependencies = await prisma.season.findFirst({
            where: {
                landId: id,
                OR: [
                    { expenses: { some: { isVoided: false } } },
                    { incomes: { some: { isVoided: false } } }
                ]
            }
        });

        if (hasDependencies) {
            return { success: false, error: 'No se puede eliminar: Existen gastos o ingresos asociados a este terreno.' };
        }

        // Soft delete
        await prisma.land.update({
            where: { id },
            data: { isActive: false },
        });
        revalidatePath('/lands');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al eliminar terreno' };
    }
}
