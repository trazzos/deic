import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '@/layout/context/authContext';

interface UseAuthRefreshOptions {
    /**
     * Intervalo en milisegundos para verificar permisos automáticamente
     * Por defecto: 5 minutos (300000ms)
     * Establecer en 0 para deshabilitar verificación automática
     */
    interval?: number;
    
    /**
     * Verificar permisos al montar el componente
     * Por defecto: true
     */
    checkOnMount?: boolean;
    
    /**
     * Verificar permisos cuando la ventana regana el foco
     * Por defecto: true
     */
    checkOnFocus?: boolean;
}

/**
 * Hook personalizado para mantener los permisos actualizados en cada página
 * 
 * @param options Opciones de configuración
 * @returns Objeto con función de refresh manual y estado de loading
 * 
 * @example
 * ```tsx
 * const { refreshAuth, isRefreshing } = useAuthRefresh({
 *   interval: 300000, // 5 minutos
 *   checkOnMount: true,
 *   checkOnFocus: true
 * });
 * 
 * // Refresh manual
 * const handleRefresh = () => {
 *   refreshAuth();
 * };
 * ```
 */
export const useAuthRefresh = (options: UseAuthRefreshOptions = {}) => {
    const {
        interval = 300000, // 5 minutos por defecto
        checkOnMount = true,
        checkOnFocus = true
    } = options;

    const { checkAuth, initialized } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Función para refrescar permisos manualmente
    const refreshAuth = useCallback(async () => {
        if (!initialized) return;
        
        try {
            setIsRefreshing(true);
            await checkAuth();
        } catch (error) {
            console.warn('Error al refrescar permisos:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [checkAuth, initialized]);

    // Verificar permisos al montar el componente
    useEffect(() => {
        if (checkOnMount && initialized) {
            refreshAuth();
        }
    }, [checkOnMount, initialized, refreshAuth]);

    // Verificación periódica automática
    useEffect(() => {
        if (!interval || interval <= 0 || !initialized) return;

        const intervalId = setInterval(() => {
            refreshAuth();
        }, interval);

        return () => clearInterval(intervalId);
    }, [interval, initialized, refreshAuth]);

    // Verificar permisos cuando la ventana regana el foco
    useEffect(() => {
        if (!checkOnFocus || !initialized) return;

        const handleFocus = () => {
            refreshAuth();
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                handleFocus();
            }
        });

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, [checkOnFocus, initialized, refreshAuth]);

    return {
        refreshAuth,
        isRefreshing
    };
};

/**
 * Hook simplificado para verificación básica de permisos en páginas
 * Usa configuración predeterminada optimizada para la mayoría de casos
 */
export const usePageAuth = () => {
    return useAuthRefresh({
        interval: 300000, // 5 minutos
        checkOnMount: true,
        checkOnFocus: true
    });
};

/**
 * Hook para verificación más frecuente (ideal para páginas críticas)
 */
export const usePageAuthCritical = () => {
    return useAuthRefresh({
        interval: 60000, // 1 minuto
        checkOnMount: true,
        checkOnFocus: true
    });
};

/**
 * Hook para verificación manual únicamente
 */
export const usePageAuthManual = () => {
    return useAuthRefresh({
        interval: 0, // Sin verificación automática
        checkOnMount: true,
        checkOnFocus: false
    });
};
