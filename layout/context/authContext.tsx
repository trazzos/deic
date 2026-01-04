import React, { createContext, useContext, useState, useEffect, useMemo, useRef, use } from 'react';
import http from '@/src/lib/axios';
import { 
    storeSessionData, 
    getStoredSessionData, 
    clearSessionData, 
    isSuperAdminRole 
} from '@/src/utils/securityUtils';

// Variable global para token en memoria (accesible desde axios)
let cachedToken: string | null = null;

export const setCachedToken = (token: string | null): void => {
    cachedToken = token;
};

export const clearCachedToken = (): void => {
        cachedToken = null;
};

export const getCachedToken = (): string | null  => {
    return cachedToken;
};

export interface AuthContextProps {
    user: any;
    isAuthenticated: boolean;
    loading: boolean;
    initialized: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    permissions: string[];
    userRoles: string[];
    token: string | null;
    isSuperAdmin: boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const hasInitialized = useRef(false);
    
    // Verificar si el usuario es superadmin
    const isSuperAdmin = useMemo(() => isSuperAdminRole(userRoles), [userRoles]);
    // Checar si está autenticado evaluando si hay un token válido
    const isAuthenticated = useMemo(() => !!getCachedToken(), [getCachedToken()]);

    // Función para limpiar todo el estado
    const clearAllState = () => {
        setUser(null);
        setPermissions([]);
        setUserRoles([]);
        clearCachedToken();
        clearSessionData();
    };

    // Función para establecer datos de usuario con validación
    const setUserData = (userData: any, userPermissions: string[] = [], userRolesList: string[] = [], token: string) => {
        if (!userData || !token) {
            clearAllState();
            return;
        }

        setUser(userData);
        setPermissions(userPermissions);
        setUserRoles(userRolesList);
        setCachedToken(token);
        
        // Almacenar solo si tenemos token válido
        storeSessionData(userPermissions, userRolesList, token, userData);
    };

    // Función para verificar autenticación
    const checkAuth = async (): Promise<void> => {
        try {
            const res = await http.get(`/api/auth/profile`);
            const responseData = res.data || res;
            
            if (!responseData || !responseData.user) {
                clearAllState();
                return;
            }

            const userData = responseData.user;
            // Extraer permisos y roles del perfil,de esta manera siempre estara actualizada si en el backend cambian
            // los permisos o roles del usuario
            const userPermissions = userData.permisos || userData.permissions || responseData.permisos || responseData.permissions || [];
            const userRolesData = userData.roles || responseData.roles || [];

            // Convertir roles a nombres soporta arrays de strings o objetos
            const roleNames = userRolesData.map((role: any) => 
                typeof role === 'string' ? role : role.name || role.role_name || role.nombre
            ).filter(Boolean);

            // Establecer datos de usuario solo si hay token
            const currentToken = getCachedToken();
            if (currentToken) {
                setUserData(userData, userPermissions, roleNames, currentToken);
            }

        } catch (error: any) {      
            // Si es 401/403, limpiar todo y el SessionGuard se encargará de redirigir
            if (error.response?.status === 401 || error.response?.status === 403) {
                clearAllState();
            } else {
                // Para otros errores, mantener datos de localStorage si existen
                const storedData = getStoredSessionData();
                if (!storedData || !storedData.permissions || !storedData.roles) {
                    clearAllState();
                }
            }
        }
    };

    useEffect(() => {
        if (hasInitialized.current) return; // Evitar doble ejecución en Strict Mode
        
        const initializeAuth = async () => {
            hasInitialized.current = true; // Marcar como inicializado
            setLoading(true);
        
            try {
                const storedData = getStoredSessionData();
                if (storedData && storedData.permissions && storedData.roles) {
                    setPermissions(storedData.permissions);
                    setUserRoles(storedData.roles);
                    setCachedToken(storedData.token || null);
                    if (storedData.user) {
                        setUser(storedData.user);
                    }
                }
                
                // Llamar checkAuth en background si hay token para verificar validez
                if (storedData?.token) {
                    checkAuth().catch((error) => {
                        clearAllState();
                    });
                }

            } catch (error) {
                clearAllState();
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };

        initializeAuth();
    }, []);


    useEffect(() => {
        // Debug en desarrollo
        if (process.env.NODE_ENV === 'development' && initialized) {
            console.log('🔐 Estado de autenticación actualizado:', {
                isAuthenticated,
                user: user?.email || 'No autenticado',
                isSuperAdmin,
                permissions: permissions.length,
                roles: userRoles
            });
        }
    }, [initialized]);

    // Función de login mejorada
    const login = async (email: string, password: string): Promise<void> => {
        setLoading(true);
        try {
            const res: any = await http.post(`/api/auth/login`, {
                email,
                password
            });
        
            if (!res || !res.user) {
                throw new Error('Respuesta de login inválida');
            }

            // Extraer token, permisos y roles del usuario
            const token = res.token;
            const userPermissions = res.user?.permisos || res.permissions || [];
            const userRolesData = res.user?.roles || res.roles || [];

            // Extraer nombres de roles del array de objetos soporta arrays de strings o objetos
            const roleNames = userRolesData.map((role: any) => 
                typeof role === 'string' ? role : role.name || role.role_name || role.nombre
            ).filter(Boolean);

            // Establecer datos de usuario
            setUserData(res.user, userPermissions, roleNames, token);
            
        } catch (error) {
            clearAllState();
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Función de logout mejorada
    const logout = async (): Promise<void> => {
        setLoading(true);
        try {
            await http.post(`/api/auth/logout`);
        } catch (error) {
            console.warn('⚠️ Error durante logout (probablemente ya desconectado):', error);
        } finally {
            clearAllState();
            setLoading(false);
        }
    };

    // Funciones de verificación de permisos mejoradas
    const hasPermission = (permission: string): boolean => {

        if (!permission) return false;
        if (isSuperAdmin) {
            return true;
        }
        
        const hasAccess = permissions.includes(permission);
        return hasAccess;
    };

    const hasAnyPermission = (requiredPermissions: string[]): boolean => {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        if (isSuperAdmin) {
            return true;
        }
        
        const hasAccess = requiredPermissions.some(permission => permissions.includes(permission));
        return hasAccess;
    };

    const hasAllPermissions = (requiredPermissions: string[]): boolean => {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        if (isSuperAdmin) {
            return true;
        }
        
        const hasAccess = requiredPermissions.every(permission => permissions.includes(permission));
        return hasAccess;
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isAuthenticated, 
            loading,
            initialized,
            login, 
            logout, 
            checkAuth,
            permissions,
            userRoles,
            token: getCachedToken(),
            isSuperAdmin,
            hasPermission,
            hasAnyPermission,
            hasAllPermissions
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};