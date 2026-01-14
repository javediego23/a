'use client';

import { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, updateUserRole, deleteUser } from '@/app/actions/user-management';
import { Plus, Trash2, Edit2, Shield, Loader2, Eye, EyeOff } from 'lucide-react';

interface User {
    id: number;
    email: string;
    role: string;
    username: string | null;
    name: string | null;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('VIEWER');
    const [actionLoading, setActionLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false); // [NEW]


    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const res = await getUsers();
        if (res.success && res.data) {
            setUsers(res.data);
        } else {
            setError(res.error || 'Error cargando usuarios');
        }
        setLoading(false);
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setEmail(user.email);
        setName(user.name || '');
        setRole(user.role);
        // Password left empty intentionally
        setIsModalOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);

        let res;
        if (editingUser) {
            // Update existing
            res = await updateUser(editingUser.email, { name, role, password: password || undefined });
        } else {
            // Create new
            res = await addUser(email, role, name, password);
        }

        if (res.success) {
            setIsModalOpen(false);
            setEditingUser(null);
            setEmail('');
            setName('');
            setPassword('');
            setRole('VIEWER');
            loadUsers();
        } else {
            alert(res.error);
        }
        setActionLoading(false);
    };

    const handleRoleChange = async (email: string, newRole: string) => {
        if (!confirm(`¿Cambiar rol de ${email} a ${newRole}?`)) return;
        const res = await updateUserRole(email, newRole);
        if (res.success) loadUsers();
        else alert(res.error);
    };

    const handleDelete = async (email: string) => {
        if (!confirm(`¿Eliminar usuario ${email}?`)) return;
        const res = await deleteUser(email);
        if (res.success) loadUsers();
        else alert(res.error);
    };

    if (loading) return <div className="p-4"><Loader2 className="animate-spin" /> Cargando usuarios...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Usuarios y Permisos</h3>
                <button
                    onClick={() => {
                        setEditingUser(null); // Clear editing state for new user
                        setEmail('');
                        setName('');
                        setPassword('');
                        setRole('VIEWER');
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                    <Plus size={18} /> Agregar Usuario
                </button>
            </div>

            <div className="bg-white/50 backdrop-blur rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100/50 text-gray-600 font-medium">
                        <tr>
                            <th className="p-4">Usuario / Email</th>
                            <th className="p-4">Rol</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-black/5">
                                <td className="p-4">
                                    <div className="font-medium">{user.name || user.username || 'Sin Nombre'}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="p-4">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.email, e.target.value)}
                                        className="bg-transparent border border-gray-300 rounded px-2 py-1 text-sm focus:border-green-500 outline-none"
                                        disabled={user.role === 'OWNER'} // Prevent demoting other owners if simpler logic desired
                                    >
                                        <option value="VIEWER">Espectador</option>
                                        <option value="EDITOR">Editor</option>
                                        <option value="OWNER">Dueño</option>
                                    </select>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleEditClick(user)}
                                        className="text-blue-500 hover:text-blue-700 p-2"
                                        title="Editar usuario"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    {user.role !== 'OWNER' && (
                                        <button
                                            onClick={() => handleDelete(user.email)}
                                            className="text-red-500 hover:text-red-700 p-2"
                                            title="Eliminar usuario"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h3>
                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                                    required
                                    placeholder="ejemplo@correo.com"
                                    disabled={!!editingUser} // Email cannot be changed here easily
                                />
                                <p className="text-xs text-gray-500 mt-1">El usuario deberá registrarse con este correo.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Contraseña</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none pr-10" // added pr-10
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {editingUser
                                        ? "Dejar en blanco para mantener la contraseña actual."
                                        : "Se registrará en Supabase (Login) y en la Base de Datos."}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Rol Inicial</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                                >
                                    <option value="VIEWER">Espectador (Solo ver + IA)</option>
                                    <option value="EDITOR">Editor (Editar datos)</option>
                                    <option value="OWNER">Dueño (Admin total)</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingUser(null); // Clear editing state on close
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Guardando...' : 'Guardar Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
