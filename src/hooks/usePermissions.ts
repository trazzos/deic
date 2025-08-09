import { useAuth } from '../../layout/context/authContext';

/**
 * Hook personalizado para manejo de permisos
 * Facilita el uso de permisos en los componentes
 */
export const usePermissions = () => {
    const { permissions, userRoles, isSuperAdmin, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

    return {
        permissions,
        userRoles,
        isSuperAdmin,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        // Helpers específicos para acciones comunes
        canCreate: (resource: string) => hasPermission(`${resource}.crear`),
        canRead: (resource: string) => hasPermission(`${resource}.eliminar`),
        canUpdate: (resource: string) => hasPermission(`${resource}.editar`),
        canDelete: (resource: string) => hasPermission(`${resource}.eliminar`),
        canManage: (resource: string) => hasPermission(`${resource}.acceso`),
        // Helper para verificar múltiples permisos de un recurso
        canAccess: (resource: string, actions: string[]) => {
            const permissionsToCheck = actions.map(action => `${resource}.${action}`);
            return hasAnyPermission(permissionsToCheck);
        }
    };
};
