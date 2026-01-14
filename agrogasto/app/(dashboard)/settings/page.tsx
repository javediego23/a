import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import ThemeToggle from '@/app/components/ThemeToggle';
import UserManagement from '@/app/components/UserManagement';
import { redirect } from 'next/navigation';
import { Settings as SettingsIcon, Palette, Users } from 'lucide-react';

async function getRole() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
    });
    return dbUser?.role;
}

export default async function SettingsPage() {
    const role = await getRole();

    if (!role) redirect('/login');

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-green-900 dark:text-green-100 flex items-center gap-3">
                    <SettingsIcon size={32} /> Configuraciones
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Administra la apariencia y los usuarios del sistema.</p>
            </header>

            <section className="bg-white/60 dark:bg-black/20 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Palette className="text-blue-500" /> Apariencia
                </h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Modo Oscuro</p>
                        <p className="text-sm text-gray-500">Cambia el esquema de colores de la aplicación.</p>
                    </div>
                    <ThemeToggle />
                </div>
            </section>

            {role === 'OWNER' && (
                <section className="bg-white/60 dark:bg-black/20 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Users className="text-purple-500" /> Gestión de Usuarios
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
