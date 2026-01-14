'use client';

import { useState } from 'react';
import { getMarketPrediction } from '@/app/actions/prediction';
import { Search, Loader2, TrendingUp, DollarSign, Sprout } from 'lucide-react';
import styles from './predictions.module.css';

export default function PredictionsPage() {
    const [cropName, setCropName] = useState('');
    const [area, setArea] = useState(1); // Hectareas
    const [currentExpenses, setCurrentExpenses] = useState(0);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    async function handlePredict(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        const res = await getMarketPrediction(cropName);
        setLoading(false);

        if (res.success && res.data) {
            const data = res.data;
            const yieldTotal = data.yieldPerHa * area;
            // Calculate total income: 
            // If unit is kg, yield is in tons (usually) for 'yieldPerHa' in db? 
            // My db says yieldPerHa is tons/ha for Cane, but wait.
            // Cane: 135 (tons). Price 130 (per ton). Total = 135 * 130. Correct.
            // Palto: 20 (tons). Price 5.80 (per kg). 
            // We need to normalize units.

            let totalIncome = 0;
            if (data.unit === 'ton') {
                totalIncome = yieldTotal * data.price;
            } else {
                // assume price is per kg, yield is tons. 1 ton = 1000 kg.
                totalIncome = (yieldTotal * 1000) * data.price;
            }

            const profit = totalIncome - currentExpenses;
            const margin = totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : 0;

            setResult({
                ...data,
                yieldTotal,
                totalIncome,
                profit,
                margin
            });
        }
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Predicciones de Mercado (IA)</h1>
                <p className={styles.subtitle}>
                    Analiza la rentabilidad basada en datos actuales de mercado en Trujillo y rendimientos históricos.
                </p>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Datos del Cultivo</h3>
                    <form onSubmit={handlePredict} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Cultivo a Consultar</label>
                            <div className={styles.inputWrapper}>
                                <Sprout size={18} />
                                <input
                                    type="text"
                                    placeholder="Ej. Caña, Palto, Maíz..."
                                    value={cropName}
                                    onChange={(e) => setCropName(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label>Hectáreas</label>
                                <input
                                    type="number"
                                    value={area}
                                    onChange={(e) => setArea(parseFloat(e.target.value))}
                                    min="0.1"
                                    step="0.1"
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Gastos Incurridos (S/.)</label>
                                <input
                                    type="number"
                                    value={currentExpenses}
                                    onChange={(e) => setCurrentExpenses(parseFloat(e.target.value))}
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <button type="submit" className={styles.predictBtn} disabled={loading}>
                            {loading ? <><Loader2 className={styles.spin} /> Analizando Mercado...</> : <><Search size={18} /> Generar Predicción</>}
                        </button>
                    </form>
                </div>

                {result && (
                    <div className={`${styles.card} ${styles.resultCard}`}>
                        <div className={styles.aiHeader}>
                            <TrendingUp size={24} color="#2563eb" />
                            <div>
                                <h3>Análisis de IA</h3>
                                <div className={styles.aiSource}>{result.source} - {result.region}</div>
                            </div>
                        </div>

                        <p className={styles.aiText}>
                            "{result.aiAnalysis}"
                        </p>

                        <div className={styles.statsGrid}>
                            <div className={styles.statBox}>
                                <span>Rendimiento Est.</span>
                                <strong>{result.yieldTotal.toFixed(1)} {result.unit === 'ton' ? 't' : 't'}</strong>
                                <small>({result.yieldPerHa} t/ha)</small>
                            </div>
                            <div className={styles.statBox}>
                                <span>Precio Mercado</span>
                                <strong>S/. {result.price.toFixed(2)}</strong>
                                <small>por {result.unit}</small>
                            </div>
                            <div className={`${styles.statBox} ${styles.income}`}>
                                <span>Ingreso Est.</span>
                                <strong>S/. {result.totalIncome.toLocaleString()}</strong>
                            </div>
                            <div className={`${styles.statBox} ${result.profit >= 0 ? styles.profit : styles.loss}`}>
                                <span>Margen Neto</span>
                                <strong>{result.margin}%</strong>
                                <small>S/. {result.profit.toLocaleString()}</small>
                            </div>
                        </div>

                        <div className={styles.disclaimer}>
                            * Valores referenciales basados en promedios regionales. Puede variar según microclima y manejo.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
