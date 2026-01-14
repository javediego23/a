'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { canEdit } from '@/utils/permissions';

export async function getCrops() {
    try {
        const crops = await prisma.crop.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { seasons: true }
                }
            }
        });
        return { success: true, data: crops };
    } catch (error) {
        return { success: false, error: 'Error al obtener cultivos' };
    }
}

export async function createCrop(formData: FormData) {
    if (!await canEdit()) return { success: false, error: 'Acceso denegado' };
    const name = formData.get('name') as string;

    if (!name) return { success: false, error: 'El nombre es obligatorio' };

    try {
        await prisma.crop.create({
            data: { name },
        });
        revalidatePath('/crops');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al crear cultivo' };
    }
}

export async function updateCrop(id: number, formData: FormData) {
    if (!await canEdit()) return { success: false, error: 'Acceso denegado' };
    const name = formData.get('name') as string;

    try {
        await prisma.crop.update({
            where: { id },
            data: { name },
        });
        revalidatePath('/crops');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al actualizar cultivo' };
    }
}

export async function deleteCrop(id: number) {
    if (!await canEdit()) return { success: false, error: 'Acceso denegado' };
    try {
        // Check for dependencies
        const hasDependencies = await prisma.season.findFirst({
            where: {
                cropId: id,
                OR: [
                    { expenses: { some: { isVoided: false } } },
                    { incomes: { some: { isVoided: false } } }
                ]
            }
        });

        if (hasDependencies) {
            return { success: false, error: 'No se puede eliminar: Existen gastos o ingresos asociados a este cultivo.' };
        }

        await prisma.crop.update({
            where: { id },
            data: { isActive: false },
        });
        revalidatePath('/crops');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al eliminar cultivo' };
    }
}

export async function createCropAndSeason(formData: FormData) {
    if (!await canEdit()) return { success: false, error: 'Acceso denegado' };
    const name = formData.get('name') as string;
    const landId = formData.get('landId') ? parseInt(formData.get('landId') as string) : null;
    const startDateStr = formData.get('startDate') as string;
    const status = formData.get('status') as string; // 'Active' or 'Finished' implicitly by isActive boolean

    if (!name) return { success: false, error: 'Nombre obligatorio' };

    try {
        // 1. Create or Find Crop (to avoid duplicates if name exists?)
        // The user request implies creating a NEW crop entry in the specific land context.
        // But our model separates Crop (Species) from Season (Instance).
        // If the user inputs "Tomate", we should check if "Tomate" exists or create it.
        // Then create a Season for it.

        // Let's first create the Crop if valid
        let crop = await prisma.crop.findFirst({ where: { name } });
        if (!crop) {
            crop = await prisma.crop.create({ data: { name } });
        }

        // 2. If Land is selected, create Season
        if (landId && startDateStr && crop) {
            const startDate = new Date(startDateStr);
            // Check if there is already an active season?
            // For now, just create it.
            await prisma.season.create({
                data: {
                    landId,
                    cropId: crop.id,
                    startDate,
                    isActive: status === 'active'
                }
            });
        }

        revalidatePath('/crops');
        revalidatePath('/lands'); // Also revalidate lands since a season was added
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Error al registrar cultivo y asignación' };
    }
}
