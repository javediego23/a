import { getCrops } from '@/app/actions/crop';
import { getUserRole } from '@/utils/permissions';
import { prisma } from '@/lib/prisma';
import CropManager from './crop-manager';
import styles from './crops.module.css';

async function getLandsSimple() {
    return await prisma.land.findMany({ where: { isActive: true }, select: { id: true, name: true } });
}

export default async function CropsPage() {
    const [cropsRes, lands, userRole] = await Promise.all([
        getCrops(),
        getLandsSimple(),
        getUserRole()
    ]);

    const crops = cropsRes.data || [];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Mis Cultivos</h1>
                <p className={styles.subtitle}>Catálogo de productos agrícolas</p>
            </header>

            <CropManager initialCrops={crops} lands={lands} userRole={userRole} />
        </div>
    );
}
