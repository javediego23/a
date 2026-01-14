import { getAllExpenses, getAllActiveSeasons } from '@/app/actions/transaction';
import GlobalExpenseManager from './expense-manager';
import styles from './expenses.module.css';

export default async function ExpensesPage() {
    const [expensesRes, seasonsRes] = await Promise.all([
        getAllExpenses(),
        getAllActiveSeasons()
    ]);

    const expenses = expensesRes.data || [];
    const activeSeasons = seasonsRes.data || [];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Registro Global de Gastos</h1>
                <p className={styles.subtitle}>Gestione los gastos de todos sus terrenos y cultivos</p>
            </header>

            <GlobalExpenseManager initialExpenses={expenses} activeSeasons={activeSeasons} />
        </div>
    );
}
