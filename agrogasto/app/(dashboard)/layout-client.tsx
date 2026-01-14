'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Map,
    Sprout,
    Wallet,
    TrendingUp,
    AlertTriangle,
    LogOut,
    Menu,
    X,
    FileText,
    Settings
} from 'lucide-react';
import { RoleProvider } from '@/app/context/RoleContext';
import { getCurrentUserName } from '@/app/actions/user-info';
import styles from './dashboard.module.css';

export default function DashboardLayoutClient({
    children,
    logoutAction
}: {
    children: React.ReactNode;
    logoutAction: () => Promise<void>;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const syncSession = async () => {
            const { syncUserRole } = await import('@/app/actions/auth-sync');
            const { createClient } = await import('@/utils/supabase/client');

            const result = await syncUserRole();
            if (result.success && result.updated) {
                console.log('🔄 Role updated from DB. Refreshing session...');
                const supabase = createClient();
                await supabase.auth.refreshSession();
                window.location.reload(); // Force reload to apply new claims to middleware
            }
        };

        syncSession();
        getCurrentUserName().then(setUserName);
    }, []);

    const isActive = (path: string) => pathname === path ? styles.active : '';

    return (
        <div className={styles.container}>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <div className={styles.logo}>
                    <Sprout size={24} color="#22c55e" />
                    <span className={styles.brand}>AgroGasto</span>
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ padding: '0.5rem' }}>
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Mobile Overlay */}
            <div
                className={`${styles.mobileOverlay} ${isSidebarOpen ? styles.open : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
                <div className={styles.logo}>
                    <Sprout size={32} color="#22c55e" />
                    <span className={styles.brand}>AgroGasto</span>
                </div>

                <div className="mb-6 px-4 py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-emerald-800">Hola,</span>
                    <h2 className="text-base font-bold text-slate-900 truncate">
                        {userName || '...'}
                    </h2>
                </div>

                <nav className={styles.nav}>
                    <Link href="/" className={`${styles.navItem} ${isActive('/')}`} onClick={() => setIsSidebarOpen(false)}>
                        <LayoutDashboard size={20} />
                        <span>Resumen</span>
                    </Link>
                    <Link href="/lands" className={`${styles.navItem} ${isActive('/lands')}`} onClick={() => setIsSidebarOpen(false)}>
                        <Map size={20} />
                        <span>Terrenos</span>
                    </Link>
                    <Link href="/crops" className={`${styles.navItem} ${isActive('/crops')}`} onClick={() => setIsSidebarOpen(false)}>
                        <Sprout size={20} />
                        <span>Cultivos</span>
                    </Link>
                    <Link href="/expenses" className={`${styles.navItem} ${isActive('/expenses')}`} onClick={() => setIsSidebarOpen(false)}>
                        <Wallet size={20} />
                        <span>Gastos</span>
                    </Link>
                    <Link href="/income" className={`${styles.navItem} ${isActive('/income')}`} onClick={() => setIsSidebarOpen(false)}>
                        <TrendingUp size={20} />
                        <span>Ingresos</span>
                    </Link>
                    <Link href="/predictions" className={`${styles.navItem} ${isActive('/predictions')}`} onClick={() => setIsSidebarOpen(false)}>
                        <AlertTriangle size={20} />
                        <span>Predicciones</span>
                    </Link>
                    <Link href="/reports" className={`${styles.navItem} ${isActive('/reports')}`} onClick={() => setIsSidebarOpen(false)}>
                        <FileText size={20} />
                        <span>Análisis Financiero</span>
                    </Link>
                    <Link href="/settings" className={`${styles.navItem} ${isActive('/settings')}`} onClick={() => setIsSidebarOpen(false)}>
                        <Settings size={20} />
                        <span>Configuraciones</span>
                    </Link>
                </nav>

                <div className={styles.footer}>
                    <button className={styles.logoutBtn} onClick={() => logoutAction()}>
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className={styles.main}>
                <RoleProvider>
                    {children}
                </RoleProvider>
            </main>
        </div>
    );
}
