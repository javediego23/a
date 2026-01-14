'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
// import { Terrain } from '@/types'; // In a real app we'd fetch these

export default function TerrainsPage() {
    const [terrains] = useState([
        { id: '1', name: 'La Loma', location: 'Sector Norte', sizeHectares: 15 },
        { id: '2', name: 'El Bajo', location: 'Cerca del Río', sizeHectares: 8.5 },
        { id: '3', name: 'Parcela Nueva', location: 'Camino Viejo', sizeHectares: 4 },
    ]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-emerald-950">Mis Terrenos</h2>
                    <p className="text-slate-600">Gestiona tus áreas de cultivo</p>
                </div>
                <Button>
                    + Agregar Terreno
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {terrains.map((terrain) => (
                    <div key={terrain.id} className="glass-panel p-6 group cursor-pointer hover:border-primary/30 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl">
                                ⛰️
                            </div>
                            <button className="text-gray-400 hover:text-primary transition-colors">
                                ⋮
                            </button>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-1">{terrain.name}</h3>
                        <p className="text-sm text-slate-600 mb-4">{terrain.location}</p>

                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tamaño</span>
                            <span className="ml-auto font-bold text-gray-800">{terrain.sizeHectares} ha</span>
                        </div>
                    </div>
                ))}

                {/* Empty State / Add New Placeholder Card */}
                <button className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all min-h-[200px]">
                    <span className="text-4xl mb-2">+</span>
                    <span className="font-semibold">Registrar Nuevo Terreno</span>
                </button>
            </div>
        </div>
    );
}
