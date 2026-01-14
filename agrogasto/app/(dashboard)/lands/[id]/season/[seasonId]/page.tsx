import { getSeasonDetails } from '@/app/actions/transaction';
import { detectAnomalies } from '@/app/actions/anomaly';
import SeasonDashboardManager from './season-dashboard';
import styles from './season.module.css';
import { notFound } from 'next/navigation';

export default async function SeasonPage({
    params
}: {
    params: Promise<{ id: string; seasonId: string }>
}) {
    const { seasonId: seasonIdStr } = await params;
    const seasonId = parseInt(seasonIdStr);
    const [{ data: season }, anomalies] = await Promise.all([
        getSeasonDetails(seasonId),
        detectAnomalies(seasonId)
    ]);

    if (!season) notFound();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.breadcrumb}>
                    terrenos / {season.land.name} / {season.crop.name}
                </div>
                <div className={styles.titleRow}>
                    <h1 className={styles.title}>Panel de Temporada</h1>
                </div>
                <div className={styles.badges}>
                    <span className={styles.cropBadge}>{season.crop.name}</span>
                    <span className={`${styles.statusBadge} ${season.isActive ? styles.active : styles.inactive}`}>
                        {season.isActive ? 'Activa' : 'Finalizada'}
                    </span>
                </div>
            </header>

            <SeasonDashboardManager season={season} anomalies={anomalies} />
        </div>
    );
}
