import { getLandDetails } from '@/app/actions/season';
import { getCrops } from '@/app/actions/crop';
import LandDetailsManager from './land-details';
import styles from './land-details.module.css';
import { notFound } from 'next/navigation';

export default async function LandPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const landId = parseInt(id);
    if (isNaN(landId)) notFound();

    const [landRes, cropsRes] = await Promise.all([
        getLandDetails(landId),
        getCrops()
    ]);

    const land = landRes.data;
    const crops = cropsRes.data || [];

    if (!land) notFound();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.breadcrumb}>Terrenos / {land.name}</div>
                <h1 className={styles.title}>{land.name}</h1>
                <p className={styles.subtitle}>{land.location || 'Sin ubicación registrada'}</p>
            </header>

            <LandDetailsManager land={land} crops={crops} />
        </div>
    );
}
