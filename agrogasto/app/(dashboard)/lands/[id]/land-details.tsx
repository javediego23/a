'use client';

import { useState } from 'react';
import { createSeason, closeSeason } from '@/app/actions/season';
import { Calendar, Sprout, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import styles from './land-details.module.css';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Season = {
    id: number;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    crop: { name: string; id: number };
    _count: { expenses: number; incomes: number };
};

type Land = {
    id: number;
    name: string;
    seasons: Season[];
};

type Crop = {
    id: number;
    name: string;
};

export default function LandDetailsManager({ land, crops }: { land: Land; crops: Crop[] }) {
    const [isCreating, setIsCreating] = useState(false);

    const activeSeason = land.seasons.find(s => s.isActive);

    async function handleCloseSeason(id: number) {
        if (confirm('¿Desea finalizar este cultivo? Se registrará la fecha actual como cierre de cosecha.')) {
            await closeSeason(id, land.id);
        }
    }

    return (
        <>
            <div className={styles.actions}>
                {!activeSeason && (
                    <button className={styles.addBtn} onClick={() => setIsCreating(true)}>
                        <Calendar size={20} />
                        <span>Sembrar / Registrar Cultivo</span>
                    </button>
                )}
                {activeSeason && (
                    <div className={styles.activeBadge}>
                        <Clock size={16} />
                        <span>Cultivo Activo</span>
                    </div>
                )}
            </div>

            {isCreating && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>Nuevo Cultivo</h3>
                        <form action={async (formData) => {
                            formData.append('landId', land.id.toString());
                            await createSeason(formData);
                            setIsCreating(false);
                        }}>
                            <div className={styles.formGroup}>
                                <label>Cultivo</label>
                                <select name="cropId" className={styles.select} required>
                                    <option value="">Seleccione un cultivo...</option>
                                    {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Fecha de Siembra / Inicio</label>
                                <input name="startDate" type="date" className={styles.input} required defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setIsCreating(false)} className={styles.cancelBtn}>Cancelar</button>
                                <button type="submit" className={styles.submitBtn}>Iniciar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <h2 className={styles.sectionTitle}>Historial de Cultivos</h2>

            <div className={styles.list}>
                {land.seasons.map((season) => (
                    <div key={season.id} className={`${styles.card} ${season.isActive ? styles.activeCard : ''}`}>
                        <div className={styles.cardContent}>
                            <div className={styles.seasonInfo}>
                                <div className={styles.cropIcon}>
                                    <Sprout size={24} color={season.isActive ? '#16a34a' : '#6b7280'} />
                                </div>
                                <div>
                                    <h3 className={styles.cropName}>{season.crop.name}</h3>
                                    <div className={styles.meta}>
                                        <span>Desde: {format(new Date(season.startDate), 'PP', { locale: es })}</span>
                                        {season.endDate && <span> - Hasta: {format(new Date(season.endDate), 'PP', { locale: es })}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.stats}>
                                <div className={styles.statItem}>
                                    <span>Gastos</span>
                                    <strong>{season._count.expenses}</strong>
                                </div>
                                <div className={styles.statItem}>
                                    <span>Ingresos</span>
                                    <strong>{season._count.incomes}</strong>
                                </div>
                            </div>
                        </div>

                        <div className={styles.cardActions}>
                            <Link href={`/lands/${land.id}/season/${season.id}`} className={styles.viewBtn}>
                                Ver Detalles <ArrowRight size={16} />
                            </Link>

                            {season.isActive && (
                                <button onClick={() => handleCloseSeason(season.id)} className={styles.closeBtn}>
                                    Finalizar Cosecha
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {land.seasons.length === 0 && (
                    <p className={styles.empty}>Este terreno no tiene cultivos registrados.</p>
                )}
            </div>
        </>
    );
}
