import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import http from '@/src/lib/axios';
import { 
    storePermissionsSecurely, 
    getStoredPermissionsSecurely, 
    clearSessionData, 
    isSuperAdminRole 
} from '@/src/utils/securityUtils';

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
    
    // Verificar si el usuario es superadmin
    const isSuperAdmin = useMemo(() => isSuperAdminRole(userRoles), [userRoles]);
    const isAuthenticated = useMemo(() => !!user, [user]);

    // Función para limpiar todo el estado
    const clearAllState = () => {
        setUser(null);
        setPermissions([]);
        setUserRoles([]);
        clearSessionData();
    };

    // Función para establecer datos de usuario con validación
    const setUserData = (userData: any, userPermissions: string[] = [], userRolesList: string[] = []) => {
        if (!userData) {
            clearAllState();
            return;
        }

        setUser(userData);
        setPermissions(userPermissions);
        setUserRoles(userRolesList);
        
        // Solo almacenar si tenemos datos válidos
        if (userPermissions.length > 0 || userRolesList.length > 0) {
            storePermissionsSecurely(userPermissions, userRolesList);
        }
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

            // Establecer datos de usuario
            setUserData(userData, userPermissions, roleNames);

        } catch (error: any) {      
            // Si es 401/403, limpiar todo y el SessionGuard se encargará de redirigir
            if (error.response?.status === 401 || error.response?.status === 403) {
                clearAllState();
            } else {
                // Para otros errores, mantener datos de localStorage si existen
                const storedData = getStoredPermissionsSecurely();
                if (!storedData || !storedData.permissions || !storedData.roles) {
                    clearAllState();
                }
            }
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
        
            try {
                const storedData = getStoredPermissionsSecurely();
                
                if (storedData && storedData.permissions && storedData.roles) {
                    setPermissions(storedData.permissions);
                    setUserRoles(storedData.roles);
                }
                await checkAuth();

            } catch (error) {
                clearAllState();
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };

        if (!initialized) {
            initializeAuth();
        }
    }, [initialized]);

    // Función de login mejorada
    const login = async (email: string, password: string): Promise<void> => {
        setLoading(true);
        try {
    
            await http.get(`/sanctum/csrf-cookie`);
            const res: any = await http.post(`/api/auth/login`, {
                email,
                password
            });
        
            if (!res || !res.user) {
                throw new Error('Respuesta de login inválida');
            }

            // Extraer permisos y roles del usuario
            const userPermissions = res.user?.permisos || res.permissions || [];
            const userRolesData = res.user?.roles || res.roles || [];

            // Extraer nombres de roles del array de objetos soporta arrays de strings o objetos
            const roleNames = userRolesData.map((role: any) => 
                typeof role === 'string' ? role : role.name || role.role_name || role.nombre
            ).filter(Boolean);

            // Establecer datos de usuario
            setUserData(res.user, userPermissions, roleNames);
            
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

    // Debug en desarrollo
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔐 Estado de autenticación:', {
                isAuthenticated,
                user: user?.email || 'No autenticado',
                isSuperAdmin,
                permissions: permissions.length,
                roles: userRoles,
                loading,
                initialized
            });
        }
    }, [isAuthenticated, user, isSuperAdmin, permissions, userRoles, loading, initialized]);

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