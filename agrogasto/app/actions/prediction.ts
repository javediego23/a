'use server';

// Simulated AI Search for Agricultural Data in Peru (La Libertad)
// In a real app, this would call a scraping service or market API.

type MarketData = {
    yieldPerHa: number; // tons/ha
    price: number; // PEN per unit (usually kg or ton)
    unit: string; // 'kg' or 'ton'
    region: string;
    source: string;
    aiAnalysis: string;
};

const MOCK_DB: Record<string, MarketData> = {
    'caña': {
        yieldPerHa: 135, // High yield in La Libertad
        price: 130, // PEN per ton
        unit: 'ton',
        region: 'La Libertad, Valle Santa Catalina',
        source: 'Simulación de Mercado (AgroDat Peru)',
        aiAnalysis: 'El precio de la caña de azúcar se mantiene estable debido a la demanda de las azucareras locales. Se recomienda cosecha en temporada seca.'
    },
    'palto': {
        yieldPerHa: 20, // 20 tons
        price: 5.80, // PEN per kg
        unit: 'kg',
        region: 'La Libertad, Chavimochic',
        source: 'Simulación de Mercado (AgroExport)',
        aiAnalysis: 'La demanda internacional de Palto Hass ha incrementado ligeramente el precio en chacra. Buen momento para asegurar contratos.'
    },
    'maiz': {
        yieldPerHa: 12,
        price: 1.10, // PEN per kg
        unit: 'kg',
        region: 'La Libertad, Virú',
        source: 'Simulación Local',
        aiAnalysis: 'Precio del maíz duro amarillo con tendencia a la baja por importaciones. Evaluar rotación de cultivo.'
    },
    'esparrago': {
        yieldPerHa: 14,
        price: 7.50, // PEN per kg
        unit: 'kg',
        region: 'La Libertad, Costa',
        source: 'Simulación AgroExport',
        aiAnalysis: 'Alta rentabilidad proyectada, aunque los costos de mano de obra para cosecha han subido.'
    },
    'arandano': {
        yieldPerHa: 18,
        price: 15.00, // PEN per kg
        unit: 'kg',
        region: 'La Libertad, Sierra/Costa',
        source: 'Boom Agroexportador',
        aiAnalysis: 'Mercado saturado en ventanas principales, pero precios premium en ventanas tempranas.'
    }
};

export async function getMarketPrediction(cropName: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const key = cropName.toLowerCase();
    let data = null;

    if (key.includes('caña') || key.includes('azucar')) data = MOCK_DB['caña'];
    else if (key.includes('palt') || key.includes('aguacate')) data = MOCK_DB['palto'];
    else if (key.includes('maiz') || key.includes('choclo')) data = MOCK_DB['maiz'];
    else if (key.includes('esparrago')) data = MOCK_DB['esparrago'];
    else if (key.includes('arandano') || key.includes('blue')) data = MOCK_DB['arandano'];
    else {
        // Default generic
        data = {
            yieldPerHa: 10,
            price: 2.50,
            unit: 'kg',
            region: 'Promedio Nacional (Estimado)',
            source: 'IA General Knowledge',
            aiAnalysis: 'No se encontraron datos específicos recientes para este cultivo en la región. Se usan valores conservadores.'
        };
    }

    return { success: true, data };
}
