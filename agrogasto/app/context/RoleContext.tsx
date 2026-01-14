'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFreshUserRole } from '@/app/actions/get-fresh-role';

interface RoleContextType {
    role: string | null;
    isLoading: boolean;
    refreshRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType>({
    role: null,
    isLoading: true,
    refreshRole: async () => { },
});

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
    const [role, setRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshRole = async () => {
        setIsLoading(true);
        try {
            const freshRole = await getFreshUserRole();
            console.log("🔒 [Security] Fresh Role Loaded:", freshRole);
            setRole(freshRole);
            // Optional: Force clear storage if needed here
        } catch (error) {
            console.error("Error fetching role:", error);
            setRole('VIEWER'); // Fallback to safe
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshRole();
    }, []);

    return (
        <RoleContext.Provider value={{ role, isLoading, refreshRole }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => useContext(RoleContext);
