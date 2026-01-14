'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';

// ... existing imports

import { createClient } from '@/utils/supabase/server';

export async function generateFinancialAnalysis(customPrompt?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    // ... data fetching

    // If custom prompt is provided, use it directly with the data
    // But wait, the function above re-fetches data every time.
    // If the client passes context string, we might just want to use that + AI?
    // No, for security and consistency, let's keep fetching data on server?
    // BUT the 'customPrompt' passed from client includes the data (see handleAnalyze calls).
    // So if customPrompt is present, we can just run it against Gemini directly?
    // User input is trusted in this context? (Authenticated user).
    // Let's allow passing a prompt that *replaces* the auto-generated context.

    try {
        if (customPrompt) {
            // Short-circuit: Just use the provided prompt if it exists
            if (!process.env.GEMINI_API_KEY) {
                return {
                    success: true,
                    analysis: "Simulacro IA: " + customPrompt.substring(0, 50) + "... (Análisis positivo)"
                };
            }
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(customPrompt + "\nResponde en español, tono profesional experto.");
            const response = await result.response;
            return { success: true, analysis: response.text() };
        }

        const expenses = await prisma.expense.findMany({
            where: { isVoided: false },
            include: { season: { include: { crop: true, land: true } } }
        });
        // ... existing logic
        const incomes = await prisma.income.findMany({
            where: { isVoided: false },
            include: { season: { include: { crop: true, land: true } } }
        });

        console.log("AI Report - Expenses Found:", expenses.length);
        console.log("AI Report - Incomes Found:", incomes.length);

        // 1. Data Aggregation
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = incomes.reduce((sum, i) => sum + i.totalPrice, 0);
        const profit = totalIncome - totalExpenses;

        const expensesByCategory: Record<string, number> = {};
        expenses.forEach(e => {
            expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
        });

        const cropPerformance: Record<string, { expense: number, income: number }> = {};
        expenses.forEach(e => {
            const cropName = e.season.crop.name;
            if (!cropPerformance[cropName]) cropPerformance[cropName] = { expense: 0, income: 0 };
            cropPerformance[cropName].expense += e.amount;
        });
        incomes.forEach(i => {
            const cropName = i.season.crop.name;
            if (!cropPerformance[cropName]) cropPerformance[cropName] = { expense: 0, income: 0 };
            cropPerformance[cropName].income += i.totalPrice;
        });

        // 2. Prepare Context for AI
        const context = `
            Act as an expert agricultural business analyst. Analyze this financial data for "AgroGasto":
            
            Global Summary:
            - Total Expenses: S/ ${totalExpenses.toFixed(2)}
            - Total Income: S/ ${totalIncome.toFixed(2)}
            - Net Profit: S/ ${profit.toFixed(2)}
            
            Top Expense Categories:
            ${Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `- ${k}: S/ ${v.toFixed(2)}`).join('\n')}

            Crop Performance (Crop: Expense / Income):
            ${Object.entries(cropPerformance).map(([k, v]) => `- ${k}: Exp S/ ${v.expense.toFixed(2)} / Inc S/ ${v.income.toFixed(2)}`).join('\n')}

            Please provide a professional summary (max 200 words) focusing on:
            1. Profitability assessment.
            2. Key cost drivers.
            3. Recommendations for cost reduction or investment.
            Write in Spanish, professional tone.
        `;

        // 3. Call AI
        if (!process.env.GEMINI_API_KEY) {
            return {
                success: true,
                analysis: "La API Key de Gemini no está configurada. Análisis simulado: Los márgenes son positivos gracias al alto rendimiento del Maíz, aunque los gastos en fertilizantes son elevados. Se recomienda revisar proveedores."
            };
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(context);
        const response = await result.response;
        const text = response.text();

        return { success: true, analysis: text };

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return { success: false, error: "Error generando análisis con IA." };
    }
}
