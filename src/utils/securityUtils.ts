/**
 * Utilidades de seguridad para el manejo de permisos
 * Incluye cifrado básico y validación de expiración
 */

// Clave base para cifrado simple (en producción debería venir del servidor)
const SECRET_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY || 'deic-secure-key-2025';

/**
 * Cifra datos usando Base64 + timestamp
 * No es cifrado militar, pero añade una capa de ofuscación
 */
export const encryptData = (data: any): string => {
    const timestamp = Date.now();
    const payload = {
        data,
        timestamp,
        checksum: btoa(JSON.stringify(data) + SECRET_KEY + timestamp)
    };
    return btoa(JSON.stringify(payload));
};

/**
 * Descifra datos y valida expiración
 * @param encryptedData - Datos cifrados
 * @param maxAge - Tiempo máximo en milisegundos (default: 24 horas)
 */
export const decryptData = (encryptedData: string, maxAge: number = 24 * 60 * 60 * 1000): any => {
    try {
        const payload = JSON.parse(atob(encryptedData));
        const { data, timestamp, checksum } = payload;
        
        // Verificar edad de los datos
        if (Date.now() - timestamp > maxAge) {
            console.warn('Permisos expirados, requiere re-autenticación');
            return null;
        }
        
        // Verificar integridad básica
        const expectedChecksum = btoa(JSON.stringify(data) + SECRET_KEY + timestamp);
        if (checksum !== expectedChecksum) {
            console.warn('Datos de permisos corruptos o manipulados');
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error al descifrar permisos:', error);
        return null;
    }
};

/**
 * Almacena permisos de forma segura
 */
export const storePermissionsSecurely = (permissions: string[], roles: string[]): void => {
    const data = { permissions, roles, sessionId: generateSessionId() };
    const encrypted = encryptData(data);
    localStorage.setItem('user_session_data', encrypted);
    
    // Limpiar datos antiguos que podrían existir
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('user_roles');
};

/**
 * Recupera permisos de forma segura
 */
export const getStoredPermissionsSecurely = (): { permissions: string[], roles: string[] } | null => {
    const encrypted = localStorage.getItem('user_session_data');
    if (!encrypted) return null;
    
    const data = decryptData(encrypted);
    if (!data) {
        // Si los datos no son válidos, limpiar storage
        localStorage.removeItem('user_session_data');
        return null;
    }
    
    return {
        permissions: data.permissions || [],
        roles: data.roles || []
    };
};

/**
 * Limpia todos los datos de sesión de forma segura
 */
export const clearSessionData = (): void => {
    localStorage.removeItem('user_session_data');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('user_roles');
    sessionStorage.clear();
};

/**
 * Genera un ID de sesión único
 */
const generateSessionId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Valida si un rol es superadmin
 */
export const isSuperAdminRole = (roles: string[]): boolean => {
    const superAdminRoles = ['superadmin', 'super_admin', 'admin_master', 'root'];
    return roles.some(role => 
        superAdminRoles.includes(role.toLowerCase()) ||
        role.toLowerCase().includes('superadmin')
    );
};
