'use client';

import * as XLSX from 'xlsx';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addExpense, deleteExpense, updateExpense } from '@/app/actions/transaction';
import { getUnits } from '@/app/actions/units';
import { Plus, Search, Filter, Calendar, Trash2, Edit2, X, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import styles from './expenses.module.css';
import { format } from 'date-fns';

type Season = {
    id: number;
    land: { name: string };
    crop: { name: string };
};

type Expense = {
    id: number;
    date: Date;
    amount: number;
    quantity: number | null; // [NEW] optional due to legacy
    category: string;
    unit: string;
    note: string | null;
    imageUrl: string | null;
    season: {
        id: number;
        land: { name: string };
        crop: { name: string };
    };
};

import { useRole } from '@/app/context/RoleContext';

export default function GlobalExpenseManager({ initialExpenses, activeSeasons }: { initialExpenses: Expense[], activeSeasons: Season[] }) {
    const { role } = useRole();
    const canEdit = role === 'OWNER';
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null); // For modal view
    const [previewImage, setPreviewImage] = useState<string | null>(null); // For form preview
    const [units, setUnits] = useState<{ name: string, symbol: string }[]>([]);

    useEffect(() => {
        getUnits().then(res => {
            if (res.success && res.data) setUnits(res.data);
        });
    }, []);

    const router = useRouter();

    const editingExpense = editingId ? initialExpenses.find(e => e.id === editingId) : null;

    const handleDelete = async (id: number) => {
        if (confirm('¿Está seguro de eliminar este gasto?')) {
            await deleteExpense(id);
            router.refresh();
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setSelectedSeasonId(expense.season.id.toString());
        setPreviewImage(expense.imageUrl);
        setIsAdding(true);
    };

    const filteredExpenses = useMemo(() => {
        return initialExpenses.filter(expense => {
            const matchesSearch =
                expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                expense.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                expense.season.land.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                expense.season.crop.name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = filterCategory ? expense.category === filterCategory : true;

            const expenseDate = new Date(expense.date);
            const matchesStart = filterDateStart ? expenseDate >= new Date(filterDateStart) : true;
            const matchesEnd = filterDateEnd ? expenseDate <= new Date(filterDateEnd) : true;

            return matchesSearch && matchesCategory && matchesStart && matchesEnd;
        });
    }, [initialExpenses, searchTerm, filterCategory, filterDateStart, filterDateEnd]);

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(filteredExpenses.map(e => ({
            Fecha: format(new Date(e.date), 'dd/MM/yyyy'),
            Terreno: e.season.land.name,
            Cultivo: e.season.crop.name,
            Categoria: e.category,
            Cantidad: e.quantity || 1, // Default to 1 if null
            Unidad: e.unit,
            Nota: e.note,
            Monto: e.amount
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Gastos Globales");
        XLSX.writeFile(wb, "Gastos_Globales.xlsx");
    };

    // Extract unique categories for filter
    const categories = Array.from(new Set(initialExpenses.map(e => e.category)));

    return (
        <>
            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search size={18} color="#6b7280" />
                    <input
                        type="text"
                        placeholder="Buscar por cultivo, terreno o nota..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filters}>
                    <select className={styles.filterSelect} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="">Todas las Categorías</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="date" className={styles.filterDate} value={filterDateStart} onChange={(e) => setFilterDateStart(e.target.value)} />
                    <span style={{ color: '#6b7280' }}>-</span>
                    <input type="date" className={styles.filterDate} value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)} />
                    {(filterCategory || filterDateStart || filterDateEnd) && (
                        <button onClick={() => { setFilterCategory(''); setFilterDateStart(''); setFilterDateEnd(''); }} className={styles.clearBtn} title="Limpiar Filtros">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.actions}>
                {canEdit && (
                    <button className={styles.addBtn} onClick={() => { setIsAdding(!isAdding); setEditingId(null); setSelectedSeasonId(''); setPreviewImage(null); }}>
                        <Plus size={20} />
                        <span>{isAdding ? 'Cancelar' : 'Registrar Gasto'}</span>
                    </button>
                )}
                <button onClick={handleExport} className={styles.addBtn} style={{ background: '#059669', marginLeft: '0.5rem' }}>
                    📊 Excel
                </button>
            </div>

            {(isAdding || editingId) && (
                <form className={styles.form} action={async (formData) => {
                    // Manual form validation and submission handling if needed

                    if (previewImage) {
                        formData.set('imageUrl', previewImage);
                    }

                    const seasonId = parseInt(selectedSeasonId || editingExpense?.season.id.toString() || '0'); // Fallback logic
                    // We need to ensure we have a seasonId. 
                    // In edit mode, we might not change the season, so we need to ensure it's passed or selected.

                    // Actually, let's force selection or use existing.
                    const finalSeasonId = selectedSeasonId ? parseInt(selectedSeasonId) : (editingExpense ? undefined : 0);

                    if (!finalSeasonId && !editingExpense) return alert('Seleccione un cultivo');

                    if (finalSeasonId) formData.set('seasonId', finalSeasonId.toString());
                    else if (editingExpense) {
                        // If we are editing and didn't change season, we might need to find the original seasonId.
                        // The types defined above don't include plain seasonId.
                        // We will rely on the user re-selecting if the field is empty, 
                        // OR we assume the server action handles missing seasonId update? 
                        // No, update usually replaces. Let's force re-selection or better yet, pre-fill correctly.
                        // Pre-fill logic below in the select value.
                    }

                    if (editingId) {
                        await updateExpense(editingId, formData);
                    } else {
                        await addExpense(formData);
                    }

                    setIsAdding(false);
                    setEditingId(null);
                    setPreviewImage(null);
                    router.refresh();
                }}>
                    <div className={styles.banner}>
                        {editingId ? '✏️ Editando Gasto' : '➕ Nuevo Gasto'}
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup} style={{ flex: 2 }}>
                            <label>Cultivo / Terreno</label>
                            <select
                                className={styles.input}
                                name="seasonId"
                                value={selectedSeasonId}
                                onChange={(e) => setSelectedSeasonId(e.target.value)}
                                required
                            >
                                <option value="">Seleccione...</option>
                                {activeSeasons.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.land.name} - {s.crop.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Fecha</label>
                            <input
                                name="date"
                                type="date"
                                className={styles.input}
                                required
                                defaultValue={editingExpense ? new Date(editingExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Monto</label>
                            <input name="amount" type="number" step="0.01" className={styles.input} placeholder="0.00" required defaultValue={editingExpense?.amount} />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Cantidad (Opcional)</label>
                            <input name="quantity" type="number" step="0.01" className={styles.input} placeholder="1" defaultValue={editingExpense?.quantity || ''} />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Unidad</label>
                            <select
                                name="unit"
                                className={styles.input}
                                required
                                defaultValue={editingExpense?.unit || 'un'}
                            >
                                {units.map(u => (
                                    <option key={u.symbol} value={u.symbol}>{u.name} ({u.symbol})</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Categoría</label>
                            <input name="category" list="categories" className={styles.input} placeholder="Ej. Fertilizante" required defaultValue={editingExpense?.category} />
                            <datalist id="categories">
                                <option value="Semillas" />
                                <option value="Fertilizantes" />
                                <option value="Fitosanitarios" />
                                <option value="Mano de Obra" />
                                <option value="Riego" />
                                <option value="Maquinaria" />
                                <option value="Combustible" />
                                <option value="Otros" />
                            </datalist>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Nota (Opcional)</label>
                        <input name="note" type="text" className={styles.input} placeholder="Detalles adicionales..." defaultValue={editingExpense?.note || ''} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Imagen (Opcional)</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setPreviewImage(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            {previewImage && (
                                <div style={{ position: 'relative', width: '50px', height: '50px' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={previewImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                    <button
                                        type="button"
                                        onClick={() => setPreviewImage(null)}
                                        style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', border: 'none', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn}>{editingId ? 'Actualizar Gasto' : 'Guardar Gasto'}</button>
                </form>
            )}

            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm mt-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cultivo - Terreno</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cantidad</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Detalle</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                            <th className="px-6 py-4 w-[120px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredExpenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-5 text-sm text-slate-600 font-medium whitespace-nowrap">
                                    {format(new Date(expense.date), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 text-sm">{expense.season.crop.name}</span>
                                        <span className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            {expense.season.land.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                                    {expense.quantity ? expense.quantity : '-'}
                                    <span className="text-xs font-normal text-slate-500 ml-1">{expense.unit}</span>
                                </td>
                                <td className="px-6 py-5 text-sm text-slate-500 max-w-[250px] truncate">
                                    <div className="flex items-center gap-2">
                                        <span>{expense.note || '-'}</span>
                                        {/* Removed unit chip since it's now in Quantity column */}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right whitespace-nowrap">
                                    <span className="font-bold text-slate-900 text-base">
                                        S/ {expense.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        {expense.imageUrl ? (
                                            <button
                                                onClick={() => setSelectedImage(expense.imageUrl)}
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                title="Ver Imagen"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        ) : (
                                            <div className="p-1.5 text-slate-200 cursor-not-allowed">
                                                <EyeOff size={16} />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => {
                                                const seasonMatch = activeSeasons.find(s =>
                                                    s.land.name === expense.season.land.name &&
                                                    s.crop.name === expense.season.crop.name
                                                );
                                                if (seasonMatch) setSelectedSeasonId(seasonMatch.id.toString());
                                                setPreviewImage(expense.imageUrl);
                                                setEditingId(expense.id);
                                                setIsAdding(true);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                            title="Editar"
                                            style={{ display: canEdit ? 'block' : 'none' }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            title="Eliminar"
                                            style={{ display: canEdit ? 'block' : 'none' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredExpenses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-400 italic bg-slate-50/30">
                                    {initialExpenses.length === 0 ? 'No hay gastos registrados. Comienza agregando uno.' : 'No se encontraron gastos con estos filtros.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4
                }} onClick={() => setSelectedImage(null)}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selectedImage} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px' }} />
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: 'absolute', top: -40, right: 0,
                                background: 'white', border: 'none', borderRadius: '50%',
                                width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
