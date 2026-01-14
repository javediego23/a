import { getLands } from '@/app/actions/land';
import LandManager from './land-manager';
import styles from './lands.module.css';

export default async function LandsPage() {
    const landsRes = await getLands();

    const lands = landsRes.data || [];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Mis Terrenos</h1>
                <p className={styles.subtitle}>Gestione sus áreas de cultivo</p>
            </header>

            <LandManager initialLands={lands} />
        </div>
    );
}
