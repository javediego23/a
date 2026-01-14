'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

export default function SessionTimeout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const supabase = createClient();
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        const resetTimer = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(async () => {
                await supabase.auth.signOut();
                router.push('/login');
                router.refresh();
            }, INACTIVITY_LIMIT);
        };

        // Events to listen for
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Initial setup
        resetTimer();

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [router, supabase]);

    return <>{children}</>;
}
