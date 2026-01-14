import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addExpense, addIncome } from '@/app/actions/transaction';
import { createCropAndSeason } from '@/app/actions/crop';

// Map action names to functions
// Note: We need to reconstruct FormData
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { queue } = body;

        if (!queue || !Array.isArray(queue)) {
            return NextResponse.json({ success: false, error: 'Invalid queue' }, { status: 400 });
        }

        const results = [];

        for (const mutation of queue) {
            const formData = new FormData();
            for (const [key, value] of Object.entries(mutation.payload)) {
                formData.append(key, value as string);
            }

            let res;
            switch (mutation.actionName) {
                case 'addExpense':
                    res = await addExpense(formData);
                    break;
                case 'addIncome':
                    res = await addIncome(formData);
                    break;
                case 'createCropAndSeason':
                    res = await createCropAndSeason(formData);
                    break;
                default:
                    res = { success: false, error: 'Unknown action' };
            }
            results.push({ id: mutation.id, ...res });
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ success: false, error: 'Server error during sync' }, { status: 500 });
    }
}
