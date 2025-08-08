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
    
    // Verificar si el usuario es superadmin
    const isSuperAdmin = useMemo(() => isSuperAdminRole(userRoles), [userRoles]);

    useEffect(() => {
        checkAuth();
    }, []);

        // Cargar permisos desde localStorage al inicializar
    useEffect(() => {
        const sessionData = getStoredPermissionsSecurely();
        if (sessionData) {
            setPermissions(sessionData.permissions);
            setUserRoles(sessionData.roles);
        }
    }, []);

    const isAuthenticated = useMemo(() => !!user, [user]);

    // Funciones de verificación de permisos
    const hasPermission = (permission: string): boolean => {
        // Superadmin tiene acceso a todo

        if (isSuperAdmin) return true;
        
        return permissions.includes(permission);
    };

    const hasAnyPermission = (requiredPermissions: string[]): boolean => {
        // Superadmin tiene acceso a todo
        if (isSuperAdmin) return true;
        return requiredPermissions.some(permission => permissions.includes(permission));
    };

    const hasAllPermissions = (requiredPermissions: string[]): boolean => {
        // Superadmin tiene acceso a todo
        if (isSuperAdmin) return true;
        return requiredPermissions.every(permission => permissions.includes(permission));
    };    
    
    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
           
            await http.get(`/sanctum/csrf-cookie`);
            const res:any = await http.post(`/api/auth/login`, {
                email,
                password
            });
        
            if(res) {
                setUser(res.user);
                
                // Extraer permisos y roles del usuario
                const userPermissions = res.user?.permisos || res.permissions || [];
                const userRolesData = res.user?.roles || res.roles || [];

                // Extraer nombres de roles del array de objetos
                const roleNames = userRolesData.map((role: any) => 
                    typeof role === 'string' ? role : role.name || role.role_name || role.nombre
                );
               
                setPermissions(userPermissions);
                setUserRoles(roleNames);
                
                // Almacenar de forma segura
                storePermissionsSecurely(userPermissions, roleNames);
            }
            
            setLoading(false);       
        } catch (error) {
            setLoading(false);
            throw error;
        }
        
    };

   
    const logout = async () => {

        setLoading(true);
        await http.post(`/api/auth/logout`);
        setUser(null);
        setPermissions([]);
        setUserRoles([]);
        clearSessionData();
        setLoading(false);
    };

    
    const checkAuth = async () => {
        setLoading(true);
        try {

            const res = await http.get(`/api/auth/profile`);
            setUser(res);

        } catch (error) {

            setUser(null);
        }
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isAuthenticated, 
            loading, 
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