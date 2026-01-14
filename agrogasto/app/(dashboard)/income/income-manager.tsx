'use client';

import * as XLSX from 'xlsx';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { addIncome, deleteIncome, updateIncome } from '@/app/actions/transaction';
import { Plus, Calendar, DollarSign, Trash2, Edit2, Search, X } from 'lucide-react';
import styles from './income.module.css';
import { format } from 'date-fns';

type Season = {
    id: number;
    land: { name: string };
    crop: { name: string };
};

type Income = {
    id: number;
    date: Date;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    category: string | null;
    season: {
        land: { name: string };
        crop: { name: string };
    };
};

export default function GlobalIncomeManager({ initialIncomes, activeSeasons }: { initialIncomes: Income[], activeSeasons: Season[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    const router = useRouter();

    const editingIncome = editingId ? initialIncomes.find(i => i.id === editingId) : null;

    const handleDelete = async (id: number) => {
        if (confirm('¿Está seguro de eliminar este ingreso?')) {
            await deleteIncome(id);
            router.refresh();
        }
    };

    const filteredIncomes = useMemo(() => {
        return initialIncomes.filter(income => {
            const matchesSearch =
                (income.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                income.season.land.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                income.season.crop.name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = filterCategory ? income.category === filterCategory : true;

            const itemDate = new Date(income.date);
            const matchesStart = filterDateStart ? itemDate >= new Date(filterDateStart) : true;
            const matchesEnd = filterDateEnd ? itemDate <= new Date(filterDateEnd) : true;

            return matchesSearch && matchesCategory && matchesStart && matchesEnd;
        });
    }, [initialIncomes, searchTerm, filterCategory, filterDateStart, filterDateEnd]);


    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(filteredIncomes.map(i => ({
            Fecha: format(new Date(i.date), 'dd/MM/yyyy'),
            Terreno: i.season.land.name,
            Cultivo: i.season.crop.name,
            Categoria: i.category,
            Detalle: `${i.quantity} ${i.unit}`,
            PrecioUnit: i.unitPrice,
            Total: i.totalPrice
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ingresos Globales");
        XLSX.writeFile(wb, "Ingresos_Globales.xlsx");
    };

    // Extract unique categories
    const categories = Array.from(new Set(initialIncomes.map(i => i.category).filter(Boolean))) as string[];

    return (
        <>
            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search size={18} color="#6b7280" />
                    <input
                        type="text"
                        placeholder="Buscar por cultivo, terreno o categoría..."
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
                <button className={styles.addBtn} onClick={() => { setIsAdding(!isAdding); setEditingId(null); setSelectedSeasonId(''); }}>
                    <Plus size={20} />
                    <span>{isAdding ? 'Cancelar' : 'Registrar Ingreso'}</span>
                </button>
                <button onClick={handleExport} className={styles.addBtn} style={{ background: '#059669', marginLeft: '0.5rem' }}>
                    📊 Excel
                </button>
            </div>

            {(isAdding || editingId) && (
                <form className={styles.form} action={async (formData) => {
                    const finalSeasonId = selectedSeasonId ? parseInt(selectedSeasonId) : (editingIncome ? undefined : 0);

                    if (!finalSeasonId && !editingIncome) return alert('Seleccione un cultivo');

                    if (finalSeasonId) formData.set('seasonId', finalSeasonId.toString());

                    if (editingId) {
                        await updateIncome(editingId, formData);
                    } else {
                        await addIncome(formData);
                    }

                    setIsAdding(false);
                    setEditingId(null);
                    router.refresh();
                }}>
                    <div className={styles.banner}>
                        {editingId ? '✏️ Editando Ingreso' : '➕ Nuevo Ingreso'}
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
                                defaultValue={editingIncome ? new Date(editingIncome.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Categoría</label>
                            <input name="category" list="incCategories" className={styles.input} placeholder="Ej. Venta Cosecha" required defaultValue={editingIncome?.category || ''} />
                            <datalist id="incCategories">
                                <option value="Venta Cosecha" />
                                <option value="Subsidio" />
                                <option value="Seguro" />
                                <option value="Devolución" />
                            </datalist>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Cantidad</label>
                            <input name="quantity" type="number" step="0.01" className={styles.input} placeholder="0" required defaultValue={editingIncome?.quantity} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Unidad</label>
                            <select
                                name="unit"
                                className={styles.input}
                                defaultValue={editingIncome?.unit || 'kg'}
                                onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                        const custom = prompt('Ingrese la nueva unidad de medida:');
                                        if (custom) {
                                            const select = e.target as HTMLSelectElement;
                                            const option = document.createElement('option');
                                            option.value = custom;
                                            option.text = custom;
                                            select.add(option, select.options[select.options.length - 1]);
                                            select.value = custom;
                                        }
                                    }
                                }}
                            >
                                <option value="kg">kg</option>
                                <option value="quintal">quintal</option>
                                <option value="ton">ton</option>
                                <option value="unidad">unidad</option>
                                <option value="jaba">jaba</option>
                                <option value="malla">malla</option>
                                <option value="custom">Otro...</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Precio Unit.</label>
                            <input name="unitPrice" type="number" step="0.01" className={styles.input} placeholder="0.00" required defaultValue={editingIncome?.unitPrice} />
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn}>{editingId ? 'Actualizar Ingreso' : 'Guardar Ingreso'}</button>
                </form>
            )}

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Cultivo / Terreno</th>
                            <th>Categoría</th>
                            <th>Detalle</th>
                            <th>Total</th>
                            <th style={{ width: '80px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredIncomes.map((income) => (
                            <tr key={income.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} color="#6b7280" />
                                        {format(new Date(income.date), 'dd/MM/yyyy')}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.landCrop}>
                                        <span className={styles.landName}>{income.season.land.name}</span>
                                        <span className={styles.cropName}>{income.season.crop.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={styles.categoryTag}>{income.category || 'Venta'}</span>
                                </td>
                                <td>
                                    {income.quantity} {income.unit} a S/ {income.unitPrice}
                                </td>
                                <td className={styles.amount}>S/ {income.totalPrice.toLocaleString('es-PE')}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => {
                                                const seasonMatch = activeSeasons.find(s =>
                                                    s.land.name === income.season.land.name &&
                                                    s.crop.name === income.season.crop.name
                                                );
                                                if (seasonMatch) setSelectedSeasonId(seasonMatch.id.toString());

                                                setEditingId(income.id);
                                                setIsAdding(true);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className={styles.iconBtn}
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(income.id)}
                                            className={styles.iconBtnDestructive}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredIncomes.length === 0 && (
                            <tr>
                                <td colSpan={6} className={styles.empty}>
                                    {initialIncomes.length === 0 ? 'No hay ingresos registrados.' : 'No se encontraron ingresos con estos filtros.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
