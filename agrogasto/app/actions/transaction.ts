'use server';

import { createClient } from '@/utils/supabase/server';
import { canEdit } from '@/utils/permissions';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSeasonDetails(seasonId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    try {
        const season = await prisma.season.findUnique({
            where: { id: seasonId },
            include: {
                crop: true,
                land: true,
                expenses: {
                    where: { isVoided: false },
                    orderBy: { date: 'desc' },
                },
                incomes: {
                    where: { isVoided: false },
                    orderBy: { date: 'desc' },
                },
            },
        });
        return { success: true, data: season };
    } catch (error) {
        return { success: false, error: 'Error al obtener datos de la temporada' };
    }
}

export async function addExpense(formData: FormData) {
    if (!await canEdit()) return { success: false, error: 'Acceso denegado (Rol requerido: Editor)' };
    const seasonId = parseInt(formData.get('seasonId') as string);
    const date = new Date(formData.get('date') as string);
    const amount = parseFloat(formData.get('amount') as string);
    const category = formData.get('category') as string;
    const unit = formData.get('unit') as string;
    const note = formData.get('note') as string;

    const imageUrl = formData.get('imageUrl') as string;

    try {
        console.log('Adding Expense:', { seasonId, date, amount, category, hasImage: !!imageUrl });
        const result = await prisma.expense.create({
            data: { seasonId, date, amount, category, unit, note, imageUrl },
        });
        console.log('Expense Created:', result.id);

        revalidatePath('/lands', 'layout');
        revalidatePath('/expenses');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error adding expense:', error);
        return { success: false, error: 'Error al registrar gasto' };
    }
}

export async function addIncome(formData: FormData) {
    if (!await canEdit()) return { success: false, error: 'Acceso denegado (Rol requerido: Editor)' };
    const seasonId = parseInt(formData.get('seasonId') as string);
    const date = new Date(formData.get('date') as string);
    const quantity = parseFloat(formData.get('quantity') as string);
    const unit = formData.get('unit') as string;
    const unitPrice = parseFloat(formData.get('unitPrice') as string);
    const category = formData.get('category') as string;
    const isEstimated = formData.get('isEstimated') === 'on';

    const totalPrice = quantity * unitPrice;

    try {
        await prisma.income.create({
            data: { seasonId, date, quantity, unit, unitPrice, totalPrice, isEstimated, category },
        });
        revalidatePath('/lands', 'layout');
        revalidatePath('/income');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error adding income:', error);
        return { success: false, error: 'Error al registrar ingreso' };
    }
}

export async function deleteExpense(id: number) {
    if (!await canEdit()) return { success: false, error: 'Acceso denegado' };
    try {
        await prisma.expense.update({ where: { id }, data: { isVoided: true } });
        revalidatePath('/lands', 'layout');
        revalidatePath('/expenses');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error' };
    }
}

export async function deleteIncome(id: number) {
    if (!await canEdit()) return { success: false, error: 'Acceso denegado' };
    try {
        await prisma.income.update({ where: { id }, data: { isVoided: true } });
        revalidatePath('/lands', 'layout');
        revalidatePath('/income');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error' };
    }
}

// ... existing code ...
export async function updateExpense(id: number, formData: FormData) {
    if (!await canEdit()) return { success: false, error: 'Acceso denegado' };
    const seasonId = parseInt(formData.get('seasonId') as string);
    const date = new Date(formData.get('date') as string);
    const amount = parseFloat(formData.get('amount') as string);
    const category = formData.get('category') as string;
    const unit = formData.get('unit') as string;
    const note = formData.get('note') as string;

    const imageUrl = formData.get('imageUrl') as string;

    try {
        await prisma.expense.update({
            where: { id },
            data: { seasonId, date, amount, category, unit, note, imageUrl },
        });
        revalidatePath('/lands', 'layout');
        revalidatePath('/expenses');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error updating expense:', error);
        return { success: false, error: 'Error al actualizar gasto' };
    }
}

export async function updateIncome(id: number, formData: FormData) {
    if (!await canEdit()) return { success: false, error: 'Acceso denegado' };
    const seasonId = parseInt(formData.get('seasonId') as string);
    const date = new Date(formData.get('date') as string);
    const quantity = parseFloat(formData.get('quantity') as string);
    const unit = formData.get('unit') as string;
    const unitPrice = parseFloat(formData.get('unitPrice') as string);
    const category = formData.get('category') as string;
    const isEstimated = formData.get('isEstimated') === 'on';
    const totalPrice = quantity * unitPrice;

    try {
        await prisma.income.update({
            where: { id },
            data: { seasonId, date, quantity, unit, unitPrice, totalPrice, isEstimated, category },
        });
        revalidatePath('/lands', 'layout');
        revalidatePath('/income');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error updating income:', error);
        return { success: false, error: 'Error al actualizar ingreso' };
    }
}

export async function getAllExpenses() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    // ... existing code ...
    console.log('Fetching all expenses...');
    const expenses = await prisma.expense.findMany({
        where: { isVoided: false },
        take: 50,
        orderBy: { date: 'desc' },
        include: {
            season: {
                include: {
                    land: true,
                    crop: true,
                },
            },
        },
    });
    console.log('Fetched expenses count:', expenses.length);
    return { success: true, data: expenses };
}

export async function getAllActiveSeasons() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    const seasons = await prisma.season.findMany({
        where: { isActive: true },
        include: {
            land: true,
            crop: true,
        },
        orderBy: { startDate: 'desc' },
    });
    return { success: true, data: seasons };
}
