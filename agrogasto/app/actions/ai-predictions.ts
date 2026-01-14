'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { MODEL_NAME } from '@/lib/gemini';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export interface PredictionResult {
    cropName: string;
    confidence: number;
    estimatedProduction: string;
    marketDemand: string;
    justification: string;
    risks: string;

    currentPrice?: string;
    priceAtHarvest?: string; // [NEW] Forecasted price
    profitability?: string;
    priceTrend?: string;

    visualStats: {
        investment: 'Alta' | 'Media' | 'Baja' | 'High' | 'Medium' | 'Low';
        time: string;
        difficulty: 'Fácil' | 'Moderada' | 'Difícil' | 'Easy' | 'Medium' | 'Hard';
    };
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // Start with 2 seconds

async function generateContentWithRetry(model: any, prompt: string) {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            return await model.generateContent(prompt);
        } catch (error: any) {
            if (error.message?.includes('429') || error.status === 429) {
                retries++;
                const delay = RETRY_DELAY * Math.pow(2, retries - 1);
                console.log(`⚠️ Rate limit hit. Retrying in ${delay}ms... (Attempt ${retries}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error(`Failed after ${MAX_RETRIES} retries due to rate limiting.`);
}

export async function generateCropPredictions(data: { location: string; date: string; area: number; areaUnit: string; otherDetails?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    if (!apiKey) return { success: false, error: 'API Key not configured' };

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `
            Act as an expert agricultural advisor for the region of ${data.location}.
            I have a land of ${data.area} ${data.areaUnit} available for sowing around ${data.date}.
            
            ${data.otherDetails ? `IMPORTANT User Constraints/Preferences: ${data.otherDetails}` : ''}

            Please analyze the climate, soil trends for this region, and market demand.
            Recommend exactly the Top 5 best crops to plant.
            
            Return the response in strict JSON format without markdown code blocks.
            IMPORTANT: All text fields MUST BE IN SPANISH.
            
            Global Market Context: 
            1. Provide realistic current prices in PEN (S/).
            2. CALCULATE the approximate harvest date based on the sowing date (${data.date}) and the crop's cycle.
            3. FORECAST the price for that specific harvest month (considering seasonality/scarcity).
            4. Base the 'profitability' and 'justification' on this FUTURE harvest price, not just the current price.
            
            The structure must be an array of objects with these keys:
            - cropName: string
            - confidence: number (0-100)
            - estimatedProduction: string (e.g. "40-50 tons") based on area
            - marketDemand: string (short description)
            - justification: string (Explain viability based on the FORECASTED harvest price and date)
            - risks: string (specific pests or climate risks)
            
            - currentPrice: string (e.g. "S/ 1.50 kg (Hoy)")
            - priceAtHarvest: string (e.g. "S/ 2.10 kg (Est. Mayo)") -> IMPORTANT: Show the estimated harvest month
            - profitability: string (e.g. "Rentabilidad estimada 35% al vender en cosecha")
            - priceTrend: string (explain the trend from now until harvest)
            
            - visualStats: object { 
                investment: "Alta"|"Media"|"Baja", 
                time: "e.g. 4 meses", 
                difficulty: "Fácil"|"Moderada"|"Difícil" 
            }
        `;

        const result = await generateContentWithRetry(model, prompt);
        const response = await result.response;
        const text = response.text();

        console.log("AI Raw Response (Predictions):", text);

        // Robust JSON extraction
        let jsonStr = text.trim();
        const firstBrace = jsonStr.indexOf('[');
        const lastBrace = jsonStr.lastIndexOf(']');

        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        } else {
            // Fallback for single object or weird wrapper
            throw new Error("Could not find JSON array in response");
        }

        const predictions = JSON.parse(jsonStr) as PredictionResult[];

        return { success: true, data: predictions };
    } catch (error: any) {
        console.error('AI Error:', error);
        return { success: false, error: error.message || 'Failed to generate predictions' };
    }
}

export async function savePrediction(prediction: PredictionResult, inputData: { location: string; date: string; area: number; areaUnit: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        await prisma.savedPrediction.create({
            data: {
                inputLocation: inputData.location,
                inputDate: new Date(inputData.date),
                inputArea: inputData.area,
                inputAreaUnit: inputData.areaUnit,

                cropName: prediction.cropName,
                confidence: prediction.confidence,
                estimatedProduction: prediction.estimatedProduction,
                marketDemand: prediction.marketDemand,
                justification: prediction.justification,
                risks: prediction.risks,

                investmentLevel: prediction.visualStats.investment,
                timeToHarvest: prediction.visualStats.time,
                maintenance: prediction.visualStats.difficulty,
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Save Error:', error);
        return { success: false, error: 'Failed to save prediction' };
    }
}

export async function getSavedPredictions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        const saved = await prisma.savedPrediction.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return { success: true, data: saved };
    } catch (error) {
        return { success: false, error: 'Failed to load saved predictions' };
    }
}
