'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCurrentUserName } from '@/app/actions/user-info';

export default function Sidebar() {
    const pathname = usePathname();
    const [userName, setUserName] = useState<string | null>(null);

    useEffect(() => {
        getCurrentUserName().then(setUserName);
    }, []);

    const navItems = [
        { name: 'Inicio', href: '/' },
        { name: 'Gastos', href: '/expenses' },
        { name: 'Ingresos', href: '/income' },
        { name: 'Terrenos', href: '/terrains' },
        { name: 'Configuraciones', href: '/settings' },
    ];

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 glass-panel border-r border-gray-200 dark:border-gray-800 flex flex-col p-6 z-50">
            <div className="mb-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    AG
                </div>
                <span className="font-bold text-xl tracking-tight text-emerald-950">AgroGasto</span>
            </div>

            <div className="mb-8 pl-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Usuario</span>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    <h2 className="text-base font-bold text-slate-800 truncate" title={userName || ''}>
                        {userName || 'Cargando...'}
                    </h2>
                </div>
            </div>

            <nav className="flex-1 flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive
                                    ? 'bg-primary text-white shadow-md'
                                    : 'hover:bg-accent/30 text-slate-700 hover:text-primary'
                                }`}
                        >
                            <span className="font-medium">{item.name}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-100">
                <div className="p-4 rounded-xl bg-accent/20 border border-accent/30">
                    <p className="text-xs font-semibold text-primary mb-1">Campaña Actual</p>
                    <p className="text-sm font-bold text-slate-900">Verano 2026</p>
                </div>
            </div>
        </aside>
    );
}
