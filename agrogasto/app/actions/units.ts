'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Default units to seed if none exist
const DEFAULT_UNITS = [
    { name: 'Kilogramos', symbol: 'kg', usage: 'BOTH' },
    { name: 'Litros', symbol: 'L', usage: 'BOTH' },
    { name: 'Unidades', symbol: 'un', usage: 'BOTH' },
    { name: 'Sacos', symbol: 'saco', usage: 'EXPENSE' },
    { name: 'Toneladas', symbol: 't', usage: 'BOTH' },
    { name: 'Horas', symbol: 'hrs', usage: 'EXPENSE' },
    { name: 'Jornales', symbol: 'jornal', usage: 'EXPENSE' },
    { name: 'Hectáreas', symbol: 'ha', usage: 'BOTH' },
    { name: 'Metros Cuadrados', symbol: 'm²', usage: 'BOTH' },
];

export async function getUnits() {
    try {
        // @ts-ignore: Stale client workaround
        let units = await prisma.unit.findMany({ orderBy: { name: 'asc' } });

        // Seed if empty
        if (units.length === 0) {
            // @ts-ignore
            await prisma.unit.createMany({ data: DEFAULT_UNITS, skipDuplicates: true });
            // @ts-ignore
            units = await prisma.unit.findMany({ orderBy: { name: 'asc' } });
        }

        return { success: true, data: units };
    } catch (error) {
        // Fallback if table doesn't exist yet
        return { success: true, data: DEFAULT_UNITS.map((u, i) => ({ ...u, id: i })) };
    }
}

export async function addUnit(name: string, symbol: string, usage: string) {
    try {
        // @ts-ignore
        await prisma.unit.create({
            data: {
                name,
                symbol,
                usage: usage as any
            }
        });
        revalidatePath('/settings');
        revalidatePath('/expenses');
        revalidatePath('/income');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al agregar unidad' };
    }
}


export async function deleteUnit(id: number) {
    try {
        // @ts-ignore
        await prisma.unit.delete({ where: { id } });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al eliminar unidad' };
    }
}

export async function updateUnit(id: number, name: string, symbol: string, usage: string) {
    try {
        // @ts-ignore
        await prisma.unit.update({
            where: { id },
            data: {
                name,
                symbol,
                usage: usage as any
            }
        });
        revalidatePath('/settings');
        revalidatePath('/expenses');
        revalidatePath('/income');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al actualizar unidad' };
    }
}
