import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import ThemeToggle from '@/app/components/ThemeToggle';
import UserManagement from '@/app/components/UserManagement';
import UnitManagement from '@/app/components/UnitManagement';
import { redirect } from 'next/navigation';
import { Settings as SettingsIcon, Palette, Users, Scale } from 'lucide-react';

async function getRole() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email } as any,
    });
    return dbUser?.role;
}

export default async function SettingsPage() {
    const role = await getRole();

    if (!role) redirect('/login');

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8">
            <header className="mb-8 border-b border-slate-200 pb-6">
                <h1 className="text-4xl font-bold text-emerald-950 flex items-center gap-3 mb-2">
                    <SettingsIcon size={40} className="text-green-600" /> Configuraciones
                </h1>
                <p className="text-xl text-slate-600">Administra usuarios y unidades del sistema.</p>
            </header>

            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-emerald-900">
                    <Scale className="text-blue-600" size={28} /> Unidades de Medida
                </h2>
                <UnitManagement />
            </section>



            {role === 'OWNER' && (
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-900">
                        <Users className="text-purple-600" /> Gestión de Usuarios
                    </h2>
                    <UserManagement />
                </section>
            )}

            {role !== 'OWNER' && (
                <div className="text-center p-8 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">Solo el dueño puede gestionar usuarios.</p>
                </div>
            )}
        </div>
    );
}
