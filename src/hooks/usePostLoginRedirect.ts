import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/layout/context/authContext';

/**
 * Hook que maneja la redirección después del login
 * Redirige al usuario a la página que intentaba acceder antes de ser enviado al login
 */
export const usePostLoginRedirect = () => {
    const { isAuthenticated, user, initialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!initialized || !isAuthenticated || !user) {
            return;
        }

        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectPath;
        } else {
            window.location.href = '/';
        }
    }, [isAuthenticated, user, initialized, router]);
};

export default usePostLoginRedirect;
