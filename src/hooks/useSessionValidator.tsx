import React, { useEffect } from 'react';
import { useAuth } from '../../layout/context/authContext';
import { getStoredPermissionsSecurely, clearSessionData } from '../utils/securityUtils';

/**
 * Hook para validar la expiración de la sesión de permisos
 * Se ejecuta periódicamente para verificar la validez de los datos almacenados
 */
export const useSessionValidator = () => {
    const { logout } = useAuth();

    useEffect(() => {
        const validateSession = () => {
            try {
                const sessionData = getStoredPermissionsSecurely();
                if (!sessionData) {
                    // Los datos han expirado o son inválidos
                    console.warn('Sesión de permisos expirada o inválida, cerrando sesión...');
                    clearSessionData();
                    logout();
                }
            } catch (error) {
                console.error('Error validando sesión:', error);
                clearSessionData();
                logout();
            }
        };

        // Validar inmediatamente
        validateSession();

        // Validar cada 10 minutos
        const interval = setInterval(validateSession, 10 * 60 * 1000);

        return () => clearInterval(interval);
    }, [logout]);
};

/**
 * Componente wrapper que valida automáticamente la sesión
 */
export const SessionValidator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useSessionValidator();
    return <>{children}</>;
};
