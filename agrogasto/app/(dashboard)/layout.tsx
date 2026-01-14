import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './layout-client';
import SessionTimeout from '@/app/components/SessionTimeout';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    async function handleLogout() {
        'use server';
        const supabase = createClient(); // Await if createClient is async, yes it is in my utils
        const client = await supabase;
        await client.auth.signOut();
        redirect('/login');
    }

    return (
        <SessionTimeout>
            <DashboardLayoutClient logoutAction={handleLogout}>
                {children}
            </DashboardLayoutClient>
        </SessionTimeout>
    );
}
