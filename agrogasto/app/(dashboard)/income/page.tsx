import { getAllActiveSeasons } from '@/app/actions/transaction';
import { prisma } from '@/lib/prisma';
import GlobalIncomeManager from './income-manager';
import styles from './income.module.css';

// We need a server action or query to get ALL income for the list
async function getAllIncome() {
    return await prisma.income.findMany({
        where: { isVoided: false },
        take: 50,
        orderBy: { date: 'desc' },
        include: {
            season: {
                include: {
                    land: true,
                    crop: true,
                },
            },
        },
    });
}

export default async function IncomePage() {
    const [incomes, activeSeasonsRes] = await Promise.all([
        getAllIncome(),
        getAllActiveSeasons()
    ]);

    const activeSeasons = activeSeasonsRes.data || [];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Registro Global de Ingresos</h1>
                <p className={styles.subtitle}>Gestione las ventas y entradas de dinero</p>
            </header>

            <GlobalIncomeManager initialIncomes={incomes} activeSeasons={activeSeasons} />
        </div>
    );
}
