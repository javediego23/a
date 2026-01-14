'use client';

import { useState } from 'react';
import { createLand, deleteLand, updateLand } from '@/app/actions/land';
import { Map, Plus, MoreVertical, Trash2, Edit2, MapPin, CalendarClock, Home, Key } from 'lucide-react';
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
    _count?: { seasons: number };
};

export default function LandManager({ initialLands }: { initialLands: Land[] }) {
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
                <button className={styles.addBtn} onClick={() => { setIsAdding(!isAdding); setEditingId(null); setLandType('OWNED'); }}>
                    <Plus size={20} />
                    <span>{isAdding ? 'Cancelar' : 'Nuevo Terreno'}</span>
                </button>
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
                        <div key={land.id} className={styles.card} style={{ borderTop: `4px solid ${color}` }}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox} style={{ background: `${color}20` }}>
                                    <Map size={24} color={color} />
                                </div>
                                <div className={styles.cardActions}>
                                    <button onClick={() => { setEditingId(land.id); setLandType(land.type); }} className={styles.actionBtn}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(land.id)} className={styles.actionBtnDestructive}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className={styles.cardTitle}>{land.name}</h3>
                            {land.location && (
                                <div className={styles.cardMeta}>
                                    <MapPin size={14} />
                                    <span>{land.location}</span>
                                </div>
                            )}

                            <div className={styles.badges}>
                                {land.type === 'OWNED' ? (
                                    <span className={`${styles.badge} ${styles.owned}`}>
                                        <Home size={12} /> Propio
                                    </span>
                                ) : (
                                    <span className={`${styles.badge} ${styles.rented}`}>
                                        <Key size={12} /> Alquilado
                                    </span>
                                )}
                            </div>

                            {land.type === 'RENTED' && land.rentStartDate && land.rentEndDate && (
                                <div className={styles.rentInfo}>
                                    <CalendarClock size={14} />
                                    <span>
                                        {format(new Date(land.rentStartDate), 'dd/MM/yy')} - {format(new Date(land.rentEndDate), 'dd/MM/yy')}
                                    </span>
                                </div>
                            )}

                            <div className={styles.cardFooter}>
                                <span>{land._count?.seasons || 0} Temporadas</span>
                            </div>
                        </div>
                    );
                })}
                {initialLands.length === 0 && (
                    <p className={styles.empty}>No hay terrenos registrados.</p>
                )}
            </div>
        </>
    );
}
