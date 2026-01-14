'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Sprout, ArrowRight, Loader2 } from 'lucide-react';
import styles from './login.module.css';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Check if input is an email (contains @). If so, use it directly.
            // Otherwise, append dummy domain for username-based login.
            const email = username.includes('@') ? username : `${username}@agrogasto.app`;

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message === 'Invalid login credentials' ? 'Credenciales inválidas' : error.message);
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <Sprout size={40} color="#16a34a" />
                    </div>
                    <h1 className={styles.title}>AgroGasto</h1>
                    <p className={styles.subtitle}>Gestión Agrícola Inteligente</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.inputGroup}>
                        <User className={styles.inputIcon} size={20} />
                        <input
                            type="text"
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <Lock className={styles.inputIcon} size={20} />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
                        {!loading && <ArrowRight size={18} className={styles.btnIcon} />}
                    </button>

                    {/* Optional: Add Sign Up link if needed, or keep it strict */}
                </form>

                <div className={styles.footer}>
                    <p>© 2026 AgroGasto Inc.</p>
                </div>
            </div>
        </div>
    );
}
