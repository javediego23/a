'use client';

import { useState, useEffect } from 'react';

type OfflineMutation = {
    id: string;
    actionName: string;
    payload: any; // Serialized FormData or object
    timestamp: number;
};

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);
    const [queue, setQueue] = useState<OfflineMutation[]>([]);

    useEffect(() => {
        // Initial check
        setIsOnline(navigator.onLine);

        // Load queue
        const saved = localStorage.getItem('offlineQueue');
        if (saved) setQueue(JSON.parse(saved));

        const handleOnline = () => {
            setIsOnline(true);
            processQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const addToQueue = (actionName: string, formData: FormData) => {
        const payload: Record<string, any> = {};
        formData.forEach((value, key) => {
            payload[key] = value;
        });

        const mutation: OfflineMutation = {
            id: crypto.randomUUID(),
            actionName,
            payload,
            timestamp: Date.now()
        };

        const newQueue = [...queue, mutation];
        setQueue(newQueue);
        localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
        alert('Sin conexión. Datos guardados para sincronización automática.');
    };

    const processQueue = async () => {
        const saved = localStorage.getItem('offlineQueue');
        if (!saved) return;

        const currentQueue = JSON.parse(saved);
        if (currentQueue.length === 0) return;

        try {
            console.log('Syncing...', currentQueue);
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queue: currentQueue })
            });

            const data = await res.json();
            if (data.success) {
                alert('¡Sincronización completada! Tus datos offline se han guardado.');
                setQueue([]);
                localStorage.removeItem('offlineQueue');
                window.location.reload(); // Refresh to show new data
            } else {
                console.error('Sync failed', data);
            }
        } catch (err) {
            console.error('Sync network error', err);
        }
    };

    return { isOnline, addToQueue, queue };
}
