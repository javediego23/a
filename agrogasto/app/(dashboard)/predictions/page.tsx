'use client';

import { useState, useEffect } from 'react';
import { generateCropPredictions, savePrediction, PredictionResult, getSavedPredictions } from '@/app/actions/ai-predictions';
import { Sprout, MapPin, Calendar, Ruler, ArrowRight, CheckCircle, AlertTriangle, TrendingUp, Clock, Activity, Bookmark, ExternalLink, X } from 'lucide-react';
import { format } from 'date-fns';

export default function PredictionsPage() {
    const [step, setStep] = useState<'FORM' | 'LOADING' | 'RESULTS'>('FORM');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [area, setArea] = useState('');
    const [areaUnit, setAreaUnit] = useState('ha');
    const [otherDetails, setOtherDetails] = useState(''); // [NEW]

    const [predictions, setPredictions] = useState<PredictionResult[]>([]);
    const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]); // Crop names
    const [showComparison, setShowComparison] = useState(false);
    const [savedList, setSavedList] = useState<any[]>([]);

    useEffect(() => {
        loadSaved();
    }, []);

    const loadSaved = async () => {
        const res = await getSavedPredictions();
        if (res.success && res.data) {
            setSavedList(res.data);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('LOADING');
        setPredictions([]);

        const res = await generateCropPredictions({
            location,
            date,
            area: parseFloat(area),
            areaUnit,
            otherDetails // [NEW]
        });

        if (res.success && res.data) {
            setPredictions(res.data);
            setStep('RESULTS');
        } else {
            console.error("Prediction Error:", res.error);
            alert(`Error: ${res.error || 'No se pudieron generar predicciones. Intente nuevamente.'}`);
            setStep('FORM');
        }
    };

    const toggleComparison = (cropName: string) => {
        if (selectedForComparison.includes(cropName)) {
            setSelectedForComparison(prev => prev.filter(c => c !== cropName));
        } else {
            if (selectedForComparison.length >= 2) {
                alert('Solo puedes comparar 2 cultivos a la vez.');
                return;
            }
            setSelectedForComparison(prev => [...prev, cropName]);
        }
    };

    const handleSave = async (prediction: PredictionResult) => {
        if (confirm(`¿Guardar predicción para ${prediction.cropName}?`)) {
            const res = await savePrediction(prediction, {
                location, date, area: parseFloat(area), areaUnit
            });
            if (res.success) {
                alert('Guardado exitosamente en tus predicciones.');
                loadSaved();
            } else {
                alert('Error al guardar.');
            }
        }
    };

    const renderComparisonModal = () => {
        const c1 = predictions.find(p => p.cropName === selectedForComparison[0]);
        const c2 = predictions.find(p => p.cropName === selectedForComparison[1]);
        if (!c1 || !c2) return null;

        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                    <button onClick={() => setShowComparison(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>

                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Comparativa de Cultivos</h2>

                        <div className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-4 mb-4">
                            <div className="font-semibold text-slate-400 text-sm uppercase tracking-wider self-center">Criterio</div>
                            <div className="text-center font-bold text-xl text-emerald-700">{c1.cropName}</div>
                            <div className="text-center font-bold text-xl text-blue-700">{c2.cropName}</div>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: 'Confianza IA', v1: `${c1.confidence}%`, v2: `${c2.confidence}%` },
                                { label: 'Producción Est.', v1: c1.estimatedProduction, v2: c2.estimatedProduction },
                                { label: 'Precio Actual', v1: c1.currentPrice, v2: c2.currentPrice },
                                { label: 'Precio Cosecha', v1: c1.priceAtHarvest, v2: c2.priceAtHarvest },
                                { label: 'Rentabilidad', v1: c1.profitability, v2: c2.profitability },
                                { label: 'Inversión', v1: c1.visualStats.investment, v2: c2.visualStats.investment },
                                { label: 'Tiempo Cosecha', v1: c1.visualStats.time, v2: c2.visualStats.time },
                                { label: 'Mantenimiento', v1: c1.visualStats.difficulty, v2: c2.visualStats.difficulty },
                                { label: 'Demanda', v1: c1.marketDemand, v2: c2.marketDemand },
                            ].map((row, i) => (
                                <div key={i} className="grid grid-cols-3 gap-4 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                                    <div className="font-medium text-slate-500 text-sm">{row.label}</div>
                                    <div className="text-center font-semibold text-slate-800">{row.v1}</div>
                                    <div className="text-center font-semibold text-slate-800">{row.v2}</div>
                                </div>
                            ))}

                            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                                <div className="font-medium text-slate-500 text-sm">Tendencia Precios</div>
                                <div className="text-xs text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-100 font-medium">{c1.priceTrend}</div>
                                <div className="text-xs text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-100 font-medium">{c2.priceTrend}</div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-2">
                                <div className="font-medium text-slate-500 text-sm">Riesgos</div>
                                <div className="text-xs text-slate-600 bg-red-50 p-3 rounded-lg border border-red-100">{c1.risks}</div>
                                <div className="text-xs text-slate-600 bg-red-50 p-3 rounded-lg border border-red-100">{c2.risks}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Asesor Agrícola IA</h1>
                <p className="text-slate-500">Optimiza tu producción con recomendaciones impulsadas por inteligencia artificial.</p>
            </div>

            {/* Input Form */}
            {step === 'FORM' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Sprout className="text-emerald-500" />
                                <span>Datos del Terreno</span>
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2">Ubicación</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <input
                                            value={location} onChange={e => setLocation(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                            placeholder="Ej. Trujillo, La Libertad"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2">Fecha de Siembra</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <input
                                            type="date"
                                            value={date} onChange={e => setDate(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2">Área Total</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Ruler className="absolute left-3 top-3 text-slate-400" size={18} />
                                            <input
                                                type="number"
                                                value={area} onChange={e => setArea(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                        <select
                                            value={areaUnit} onChange={e => setAreaUnit(e.target.value)}
                                            className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-2 focus:border-emerald-500 outline-none text-slate-600 font-medium"
                                        >
                                            <option value="ha">ha</option>
                                            <option value="m2">m²</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2">Otros Detalles (Opcional)</label>
                                <textarea
                                    value={otherDetails}
                                    onChange={e => setOtherDetails(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none h-24"
                                    placeholder="Ej. Prefiero cultivos de ciclo corto, tengo poca disponibilidad de agua, suelo arcilloso..."
                                />
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <span>Analizar y Generar Recomendaciones</span>
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    </div >

                    {/* Saved Predictions Mini-List (Side) */}
                    < div className="space-y-4" >
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Bookmark className="text-blue-500" size={20} />
                            <span>Guardados Recientes</span>
                        </h3>
                        {
                            savedList.length === 0 ? (
                                <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-400 text-sm border border-dashed border-slate-200">
                                    No tienes predicciones guardadas.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {savedList.map((item: any) => (
                                        <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-slate-800">{item.cropName}</span>
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{format(new Date(item.createdAt), 'dd/MM/yyyy')}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 line-clamp-2">{item.justification}</div>
                                        </div>
                                    ))}
                                </div>
                            )
                        }
                    </div >
                </div >
            )
            }

            {/* Loading State */}
            {
                step === 'LOADING' && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mb-8"></div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Analizando Datos...</h3>
                        <p className="text-slate-500 max-w-md text-center">Nuestra IA está consultando bases de datos climáticas de {location}, evaluando tendencias de mercado y calculando proyecciones de rendimiento.</p>
                    </div>
                )
            }

            {/* Results State */}
            {
                step === 'RESULTS' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setStep('FORM')} className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-1">
                                    <ArrowRight className="rotate-180" size={16} /> Volver
                                </button>
                                <span className="h-6 w-px bg-slate-200"></span>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Resultados para {location}</h2>
                                    <p className="text-xs text-slate-500">Suelo: {area} {areaUnit} • Siembra: {date}</p>
                                </div>
                            </div>
                            {selectedForComparison.length === 2 && (
                                <button
                                    onClick={() => setShowComparison(true)}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-slate-900/10 active:scale-95 transition-all animate-bounce"
                                >
                                    Comparar Seleccionados (2)
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {predictions.map((p, idx) => (
                                <div key={idx} className={`relative bg-white rounded-2xl overflow-hidden border transition-all duration-200 ${selectedForComparison.includes(p.cropName) ? 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-xl scale-[1.02]' : 'border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-200'}`}>
                                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">{p.cropName}</h3>
                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mt-1 inline-block">Top {idx + 1} Recomendado</span>
                                        </div>
                                        <div className="flex flex-col items-center bg-white border border-slate-100 rounded-lg p-2 shadow-sm">
                                            <span className={`text-xl font-bold ${p.confidence >= 80 ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                {p.confidence}%
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Confianza</span>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-4">
                                        <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                                            <span className="text-slate-500">Producción Est.</span>
                                            <span className="font-bold text-slate-900">{p.estimatedProduction}</span>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Justificación</h4>
                                            <p className="text-sm text-slate-600 leading-relaxed">{p.justification}</p>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Análisis de Mercado</h4>
                                            <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Precio Actual:</span>
                                                    <span className="font-bold text-slate-800">{p.currentPrice}</span>
                                                </div>
                                                <div className="flex justify-between text-xs bg-emerald-100/50 p-1 -mx-1 rounded">
                                                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                                        Precio a Cosecha
                                                        <TrendingUp size={12} />
                                                    </span>
                                                    <span className="font-bold text-emerald-800">{p.priceAtHarvest}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Rentabilidad:</span>
                                                    <span className="font-bold text-emerald-700">{p.profitability}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 italic border-t border-emerald-100 pt-2 mt-1">
                                                    "{p.priceTrend}"
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Riesgos</h4>
                                            <div className="flex items-start gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
                                                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-xs text-red-700 font-medium">{p.risks}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 pt-2">
                                            <div className="bg-slate-50 p-2 rounded-lg text-center">
                                                <div className="text-[10px] text-slate-400 uppercase">Inversión</div>
                                                <div className="font-bold text-sm text-slate-700">{p.visualStats.investment}</div>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-lg text-center">
                                                <div className="text-[10px] text-slate-400 uppercase">Tiempo</div>
                                                <div className="font-bold text-sm text-slate-700">{p.visualStats.time}</div>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-lg text-center">
                                                <div className="text-[10px] text-slate-400 uppercase">Dificultad</div>
                                                <div className="font-bold text-sm text-slate-700">{p.visualStats.difficulty}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={selectedForComparison.includes(p.cropName)}
                                                onChange={() => toggleComparison(p.cropName)}
                                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm font-medium text-slate-600">Comparar</span>
                                        </label>
                                        <button onClick={() => handleSave(p)} className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full" title="Guardar Predicción">
                                            <Bookmark size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {showComparison && renderComparisonModal()}
        </div >
    );
}
