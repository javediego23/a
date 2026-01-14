'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getLandDetails(landId: number) {
    try {
        const land = await prisma.land.findUnique({
            where: { id: landId },
            include: {
                seasons: {
                    orderBy: { startDate: 'desc' },
                    include: {
                        crop: true,
                        _count: {
                            select: { expenses: true, incomes: true }
                        }
                    }
                }
            }
        });
        return { success: true, data: land };
    } catch (error) {
        return { success: false, error: 'Error al obtener detalles del terreno' };
    }
}

export async function createSeason(formData: FormData) {
    const landId = parseInt(formData.get('landId') as string);
    const cropId = parseInt(formData.get('cropId') as string);
    const startDate = new Date(formData.get('startDate') as string);

    if (!landId || !cropId) return { success: false, error: 'Datos incompletos' };

    try {
        // Check if there is already an active season? 
        // Requirement says: "Un terreno puede tener múltiples temporadas...". 
        // Usually one active season at a time per land makes sense, but maybe overlapping?
        // Let's assume sequential for now to calculate profitability cleanly per season.
        const activeSeason = await prisma.season.findFirst({
            where: { landId, isActive: true },
        });

        if (activeSeason) {
            return { success: false, error: 'Ya existe una temporada activa en este terreno' };
        }

        await prisma.season.create({
            data: {
                landId,
                cropId,
                startDate,
                isActive: true,
            },
        });
        revalidatePath(`/lands/${landId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al crear temporada' };
    }
}

export async function closeSeason(seasonId: number, landId: number) {
    try {
        await prisma.season.update({
            where: { id: seasonId },
            data: {
                isActive: false,
                endDate: new Date()
            },
        });
        revalidatePath(`/lands/${landId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al finalizar temporada' };
    }
}
