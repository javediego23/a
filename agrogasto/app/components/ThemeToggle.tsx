'use client';

import { useTheme } from '@/app/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button onClick={toggleTheme} className={styles.toggleButton} aria-label="Toggle Dark Mode">
            {theme === 'light' ? (
                <>
                    <Moon size={20} className="mr-2" /> Modo Oscuro
                </>
            ) : (
                <>
                    <Sun size={20} className="mr-2" /> Modo Claro
                </>
            )}
        </button>
    );
}
