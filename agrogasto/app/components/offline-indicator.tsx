'use client';

import { WifiOff } from 'lucide-react';
import { useOfflineSync } from '@/app/hooks/use-offline-sync';
import { useEffect, useState } from 'react';

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        window.addEventListener('online', () => setIsOnline(true));
        window.addEventListener('offline', () => setIsOnline(false));
    }, []);

    if (isOnline) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            background: '#dc2626',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 50
        }}>
            <WifiOff size={20} />
            <span style={{ fontWeight: 500 }}>Modo Offline</span>
        </div>
    );
}
