import { logout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './layout-client';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    async function handleLogout() {
        'use server';
        await logout();
        redirect('/login');
    }

    return (
        <DashboardLayoutClient logoutAction={handleLogout}>
            {children}
        </DashboardLayoutClient>
    );
}
