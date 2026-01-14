import { getLands } from '@/app/actions/land';
import { getUserRole } from '@/utils/permissions';
import LandManager from './land-manager';
import styles from './lands.module.css';

export default async function LandsPage() {
    const [landsRes, userRole] = await Promise.all([
        getLands(),
        getUserRole()
    ]);

    const lands = landsRes.data || [];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Mis Terrenos</h1>
                <p className={styles.subtitle}>Gestione sus áreas de cultivo</p>
            </header>

            <LandManager initialLands={lands} userRole={userRole} />
        </div>
    );
}
