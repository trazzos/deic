import React, { useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Componente de debug para mostrar información de permisos
 * Solo debe usarse en desarrollo
 */
export const PermissionsDebugger: React.FC = () => {
    const { permissions, userRoles, isSuperAdmin } = usePermissions();
    const [isVisible, setIsVisible] = useState(false);

    // Solo mostrar en desarrollo
    if (process.env.NODE_ENV === 'production') {
        return null;
    }

    if (!isVisible) {
        return (
            <div 
                className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded cursor-pointer z-50"
                onClick={() => setIsVisible(true)}
            >
                🔐 Debug Permisos
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded shadow-lg z-50 max-w-md">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Permisos Debug</h3>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="text-gray-300 hover:text-white"
                >
                    ✕
                </button>
            </div>
            
            <div className="text-sm space-y-2">
                <div>
                    <strong>SuperAdmin:</strong> 
                    <span className={isSuperAdmin ? 'text-green-400' : 'text-red-400'}>
                        {isSuperAdmin ? ' ✓ Sí' : ' ✗ No'}
                    </span>
                </div>
                
                <div>
                    <strong>Roles ({userRoles.length}):</strong>
                    <div className="ml-2 max-h-20 overflow-y-auto">
                        {userRoles.length > 0 ? (
                            userRoles.map((role, index) => (
                                <div key={index} className="text-blue-300">• {role}</div>
                            ))
                        ) : (
                            <div className="text-gray-400">Sin roles</div>
                        )}
                    </div>
                </div>
                
                <div>
                    <strong>Permisos ({permissions.length}):</strong>
                    <div className="ml-2 max-h-32 overflow-y-auto">
                        {permissions.length > 0 ? (
                            permissions.map((permission, index) => (
                                <div key={index} className="text-green-300 text-xs">• {permission}</div>
                            ))
                        ) : (
                            <div className="text-gray-400">Sin permisos explícitos</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PermissionsDebugger;
