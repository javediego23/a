'use client';

import { useState, useEffect } from 'react';
import { getUnits, addUnit, deleteUnit, updateUnit } from '@/app/actions/units';
import { Plus, Trash2, Tag, Edit2 } from 'lucide-react';

interface Unit {
    id: number;
    name: string;
    symbol: string;
    usage?: 'EXPENSE' | 'INCOME' | 'BOTH';
}

export default function UnitManagement() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [usage, setUsage] = useState<string>('BOTH');

    // Edit state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUnits();
    }, []);

    const loadUnits = async () => {
        const res = await getUnits();
        if (res.success && res.data) {
            // @ts-ignore
            setUnits(res.data);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let res;
        if (editingId) {
            res = await updateUnit(editingId, name, symbol, usage);
        } else {
            res = await addUnit(name, symbol, usage);
        }

        if (res.success) {
            setName('');
            setSymbol('');
            setUsage('BOTH');
            setEditingId(null);
            loadUnits();
        } else {
            alert('Error al guardar unidad');
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta unidad?')) return;
        const res = await deleteUnit(id);
        if (res.success) loadUnits();
    };

    const startEdit = (unit: Unit) => {
        setEditingId(unit.id);
        setName(unit.name);
        setSymbol(unit.symbol);
        setUsage(unit.usage || 'BOTH');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName('');
        setSymbol('');
        setUsage('BOTH');
    };

    const getUsageLabel = (u: string) => {
        if (u === 'EXPENSE') return { label: 'Gastos', color: 'text-red-600 bg-red-100 border-red-200' };
        if (u === 'INCOME') return { label: 'Ingresos', color: 'text-green-600 bg-green-100 border-green-200' };
        return { label: 'Global', color: 'text-blue-600 bg-blue-100 border-blue-200' };
    };

    const globalUnits = units.filter(u => !u.usage || u.usage === 'BOTH');
    const expenseUnits = units.filter(u => u.usage === 'EXPENSE');
    const incomeUnits = units.filter(u => u.usage === 'INCOME');

    const renderUnitGrid = (list: Unit[], title: string, emptyMsg: string) => (
        <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h4>
            {list.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {list.map(unit => {
                        const usageStyle = getUsageLabel(unit.usage || 'BOTH');
                        return (
                            <div key={unit.id} className="relative bg-white border border-slate-200 p-4 rounded-xl hover:shadow-md transition-shadow group flex flex-col justify-between h-[100px]">
                                <div className="flex flex-col h-full justify-between">
                                    <div className="flex justify-between items-start">
                                        <span className="text-2xl font-bold text-slate-800 tracking-tight">{unit.symbol}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEdit(unit)}
                                                className="text-slate-400 hover:text-blue-500 p-1 hover:bg-blue-50 rounded"
                                                title="Editar"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(unit.id)}
                                                className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xs text-slate-500 font-medium truncate max-w-[80%]">{unit.name}</span>
                                        <div className={`w-2 h-2 rounded-full ${usageStyle.color.replace('text-', 'bg-').split(' ')[0]}`}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-slate-400 italic bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">{emptyMsg}</p>
            )}
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Unidades de Medida</h3>
                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{units.length} Unidades</span>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex-1 w-full">
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Nombre</label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                        placeholder="Ej. Metros Cuadrados"
                        required
                    />
                </div>
                <div className="w-full md:w-32">
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Símbolo</label>
                    <input
                        value={symbol}
                        onChange={e => setSymbol(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                        placeholder="m²"
                        required
                    />
                </div>
                <div className="w-full md:w-48">
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Categoría</label>
                    <div className="relative">
                        <select
                            value={usage}
                            onChange={e => setUsage(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none appearance-none transition-all cursor-pointer"
                        >
                            <option value="BOTH">Global</option>
                            <option value="EXPENSE">Gastos</option>
                            <option value="INCOME">Ingresos</option>
                        </select>
                        <Tag className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {editingId && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="w-full md:w-auto bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-lg transition-all font-semibold"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                        {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                        <span>{editingId ? 'Actualizar' : 'Agregar'}</span>
                    </button>
                </div>
            </form>

            <div className="space-y-8">
                {renderUnitGrid(globalUnits, 'Globales (Disponibles en todo)', 'No hay unidades globales.')}
                {renderUnitGrid(expenseUnits, 'Exclusivas de Gastos', 'No hay unidades exclusivas de gastos.')}
                {renderUnitGrid(incomeUnits, 'Exclusivas de Ingresos', 'No hay unidades exclusivas de ingresos.')}
            </div>
        </div>
    );
}
