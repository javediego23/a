'use client';

import { useState } from 'react';
import { createLand, deleteLand, updateLand } from '@/app/actions/land';
import { Map, Plus, Trash2, Edit2, MapPin, CalendarClock, Home, Key, Ruler } from 'lucide-react';
import styles from './lands.module.css';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

type Land = {
    id: number;
    name: string;
    location: string | null;
    type: string; // 'OWNED' | 'RENTED'
    rentStartDate: Date | null;
    rentEndDate: Date | null;
    area: number;
    areaUnit: string;
    _count?: { seasons: number };
};

import { useRole } from '@/app/context/RoleContext';

export default function LandManager({ initialLands }: { initialLands: Land[] }) {
    const { role } = useRole();
    const canEdit = role === 'OWNER';
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [landType, setLandType] = useState('OWNED');

    // Helper to pre-fill form when editing
    const editingLand = editingId ? initialLands.find(l => l.id === editingId) : null;

    async function handleDelete(id: number) {
        if (confirm('¿Está seguro de eliminar este terreno?')) {
            const result = await deleteLand(id);
            if (!result.success && result.error) {
                alert(result.error);
            }
        }
    }

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(initialLands.map(l => ({
            ID: l.id,
            Nombre: l.name,
            Ubicacion: l.location,
            Tipo: l.type === 'OWNED' ? 'Propio' : 'Alquilado',
            Area: `${l.area} ${l.areaUnit}`,
            'Inicio Alquiler': l.rentStartDate ? format(new Date(l.rentStartDate), 'dd/MM/yyyy') : '',
            'Fin Alquiler': l.rentEndDate ? format(new Date(l.rentEndDate), 'dd/MM/yyyy') : '',
            'Temporadas': l._count?.seasons || 0
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Terrenos");
        XLSX.writeFile(wb, "Terrenos_AgroGasto.xlsx");
    };

    return (
        <>
            <div className={styles.actions}>
                {canEdit && (
                    <button className={styles.addBtn} onClick={() => { setIsAdding(!isAdding); setEditingId(null); setLandType('OWNED'); }}>
                        <Plus size={20} />
                        <span>{isAdding ? 'Cancelar' : 'Nuevo Terreno'}</span>
                    </button>
                )}
                <button onClick={handleExport} className={styles.addBtn} style={{ background: '#059669', marginLeft: '0.5rem' }}>
                    📊 Excel
                </button>
            </div>

            {(isAdding || editingId) && (
                <form className={styles.form} action={async (formData) => {
                    if (editingId) await updateLand(editingId, formData);
                    else await createLand(formData);
                    setIsAdding(false);
                    setEditingId(null);
                }}>
                    <div className={styles.formGroup}>
                        <label>Nombre del Terreno</label>
                        <input name="name" type="text" placeholder="Ej. Finca El Roble" className={styles.input} required defaultValue={editingLand?.name} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Ubicación</label>
                        <input name="location" type="text" placeholder="Ej. Sector Norte" className={styles.input} defaultValue={editingLand?.location || ''} />
                    </div>

                    <div className={styles.formGroup} style={{ flexGrow: 0.5 }}>
                        <label>Área</label>
                        <div className="flex gap-2">
                            <input name="area" type="number" step="0.01" placeholder="0.00" className={styles.input} defaultValue={editingLand?.area || ''} required />
                            <select name="areaUnit" className={styles.input} defaultValue={editingLand?.areaUnit || 'ha'} style={{ width: '80px' }}>
                                <option value="ha">ha</option>
                                <option value="m²">m²</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Tipo de Tenencia</label>
                        <select name="type" className={styles.input} value={editingLand ? undefined : landType} onChange={(e) => setLandType(e.target.value)} defaultValue={editingLand?.type || 'OWNED'}>
                            <option value="OWNED">Propio</option>
                            <option value="RENTED">Alquilado</option>
                        </select>
                    </div>

                    {(landType === 'RENTED' || (editingLand?.type === 'RENTED')) && (
                        <>
                            <div className={styles.formGroup}>
                                <label>Inicio Alquiler</label>
                                <input name="rentStartDate" type="date" className={styles.input} defaultValue={editingLand?.rentStartDate ? new Date(editingLand.rentStartDate).toISOString().split('T')[0] : ''} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Fin Alquiler</label>
                                <input name="rentEndDate" type="date" className={styles.input} defaultValue={editingLand?.rentEndDate ? new Date(editingLand.rentEndDate).toISOString().split('T')[0] : ''} />
                            </div>
                        </>
                    )}

                    <button type="submit" className={styles.submitBtn}>
                        {editingId ? 'Actualizar' : 'Guardar'}
                    </button>
                </form>
            )}

            <div className={styles.grid}>
                {initialLands.map((land) => {
                    const colors = ['#059669', '#1d4ed8', '#b45309', '#7e22ce', '#be185d', '#0e7490'];
                    const color = colors[land.id % colors.length];

                    return (
                        <div key={land.id}
                            className={styles.card}
                            style={{ borderTop: `4px solid ${color}` }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox} style={{ background: `${color}20` }}>
                                    <Map size={24} color={color} />
                                </div>
                                <div className={styles.cardActions}>
                                    <button
                                        onClick={() => { setEditingId(land.id); setLandType(land.type); }}
                                        className={styles.actionBtn}
                                        style={{ display: canEdit ? 'flex' : 'none' }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(land.id)}
                                        className={styles.actionBtnDestructive}
                                        style={{ display: canEdit ? 'flex' : 'none' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className={styles.cardTitle}>{land.name}</h3>

                            {land.location && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                    <MapPin size={14} />
                                    <span>{land.location}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-gray-700 mb-4 font-medium">
                                <Ruler size={14} className="text-gray-400" />
                                <span>{land.area} {land.areaUnit}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {land.type === 'OWNED' ? (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                        <Home size={12} /> Propio
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                        <Key size={12} /> Alquilado
                                    </span>
                                )}
                            </div>

                            {land.type === 'RENTED' && land.rentStartDate && land.rentEndDate && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-slate-50 p-2 rounded-lg mb-4 border border-slate-100">
                                    <CalendarClock size={14} />
                                    <span>
                                        {format(new Date(land.rentStartDate), 'dd/MM/yy')} - {format(new Date(land.rentEndDate), 'dd/MM/yy')}
                                    </span>
                                </div>
                            )}

                            <div className={styles.cardFooter}>
                                <div className="flex justify-between items-center w-full">
                                    <span>{land._count?.seasons || 0} Temporadas</span>
                                    {land._count?.seasons && land._count.seasons > 0 ? (
                                        <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded text-xs">Activo</span>
                                    ) : (
                                        <span className="text-slate-400">Sin actividad</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {initialLands.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-400 border border-dashed border-gray-300 rounded-2xl">
                        <Home size={48} className="mb-4 opacity-20" />
                        <p>No hay terrenos registrados.</p>
                    </div>
                )}
            </div>
        </>
    );
}
