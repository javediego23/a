'use client';

import { useState } from 'react';
import { createCrop, deleteCrop, updateCrop, createCropAndSeason } from '@/app/actions/crop';
import { Sprout, Plus, Trash2, Edit2 } from 'lucide-react';
import styles from './crops.module.css';
import * as XLSX from 'xlsx';

type Crop = {
    id: number;
    name: string;
    _count?: { seasons: number };
};

export default function CropManager({ initialCrops, lands, userRole }: { initialCrops: Crop[], lands: { id: number, name: string }[], userRole: string | null | undefined }) {
    const canEdit = userRole === 'OWNER';
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    async function handleDelete(id: number) {
        if (confirm('¿Está seguro de eliminar este cultivo?')) {
            const result = await deleteCrop(id);
            if (!result.success && result.error) {
                alert(result.error);
            }
        }
    }

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(initialCrops.map(c => ({
            ID: c.id,
            Nombre: c.name,
            'Usos en Temporadas': c._count?.seasons || 0
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cultivos");
        XLSX.writeFile(wb, "Cultivos_AgroGasto.xlsx");
    };

    return (
        <>
            <div className={styles.actions}>
                {canEdit && (
                    <button className={styles.addBtn} onClick={() => setIsAdding(!isAdding)}>
                        <Plus size={20} />
                        <span>{isAdding ? 'Cancelar' : 'Registrar Cultivo / Siembra'}</span>
                    </button>
                )}
                <button onClick={handleExport} className={styles.addBtn} style={{ background: '#059669', marginLeft: '0.5rem' }}>
                    📊 Excel
                </button>
            </div>

            {(isAdding || editingId) && (
                <form className={styles.form} action={async (formData) => {
                    // Use new action for creation
                    if (editingId) await updateCrop(editingId, formData);
                    else {
                        await createCropAndSeason(formData);
                    }
                    setIsAdding(false);
                    setEditingId(null);
                }}>
                    <div className={styles.formGroup}>
                        <label>Nombre del Cultivo</label>
                        <input name="name" type="text" placeholder="Ej. Tomate" className={styles.input} required />
                    </div>

                    {!editingId && (
                        <div className={styles.assignmentSection} style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Asignar a Terreno (Obligatorio)</h4>
                            <div className={styles.formRow} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div className={styles.formGroup}>
                                    <label>Terreno</label>
                                    <select name="landId" className={styles.input} required>
                                        <option value="">-- Seleccione Terreno --</option>
                                        {lands.map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Fecha Inicio</label>
                                    <input name="startDate" type="date" className={styles.input} required defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Estado</label>
                                    <select name="status" className={styles.input} required>
                                        <option value="active">En Proceso</option>
                                        <option value="finished">Finalizado</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <button type="submit" className={styles.submitBtn}>
                        {editingId ? 'Actualizar Nombre' : 'Guardar y Asignar'}
                    </button>
                </form>
            )}

            <div className={styles.grid}>
                {initialCrops.map((crop) => {
                    const colors = ['#16a34a', '#2563eb', '#d97706', '#9333ea', '#db2777', '#0891b2'];
                    const color = colors[crop.id % colors.length];

                    return (
                        <div key={crop.id} className={styles.card} style={{ borderTop: `4px solid ${color}` }}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconBox} style={{ background: `${color}20` }}>
                                    <Sprout size={24} color={color} />
                                </div>
                                <div className={styles.cardActions}>
                                    <button
                                        onClick={() => setEditingId(crop.id)}
                                        className={styles.actionBtn}
                                        style={{ display: canEdit ? 'flex' : 'none' }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(crop.id)}
                                        className={styles.actionBtnDestructive}
                                        style={{ display: canEdit ? 'flex' : 'none' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className={styles.cardTitle}>{crop.name}</h3>

                            <div className={styles.cardFooter}>
                                <span>{crop._count?.seasons || 0} Usos en Temporadas</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
