import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import http from '../lib/axios';

export function useAuthGuard() {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                await http.get(`/api/auth/profile`, {
                    withCredentials: true,
                });
                // Si la sesión es válida, no hace nada
            } catch (error) {
                // Si la sesión no es válida, redirige al login
                router.replace('/auth/login');
            }
        };
        checkSession();
    }, [router]);
}