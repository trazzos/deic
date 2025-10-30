import React from 'react';
import { BreadCrumb } from 'primereact/breadcrumb';
import { MenuItem } from 'primereact/menuitem';

interface CustomBreadcrumbProps {
    /**
     * Items del breadcrumb
     */
    items: MenuItem[];
    
    /**
     * Item home del breadcrumb
     */
    home?: MenuItem;
    
    /**
     * Tema de color del breadcrumb
     */
    theme?: 'green' | 'blue' | 'purple' | 'orange' | 'gray';
    
    /**
     * Título principal de la página
     */
    title: string;
    
    /**
     * Descripción de la página
     */
    description?: string;
    
    /**
     * Icono del título
     */
    icon?: string;
    
    /**
     * Clase CSS adicional para el contenedor
     */
    className?: string;
}

/**
 * Componente reutilizable para breadcrumbs con estilos consistentes
 */
export const CustomBreadcrumb: React.FC<CustomBreadcrumbProps> = ({
    items,
    home = { icon: 'pi pi-home', command: () => window.location.href = '/' },
    theme = 'blue',
    title,
    description,
    icon,
    className = ''
}) => {
    const themeConfigs = {
        green: {
            gradient: 'from-green-50 to-emerald-50',
            border: 'border-green-100',
            titleColor: 'text-green-800',
            iconColor: 'text-green-600',
            descColor: 'text-green-600'
        },
        blue: {
            gradient: 'from-blue-50 to-cyan-50',
            border: 'border-blue-100',
            titleColor: 'text-blue-800',
            iconColor: 'text-blue-600',
            descColor: 'text-blue-600'
        },
        purple: {
            gradient: 'from-purple-50 to-violet-50',
            border: 'border-purple-100',
            titleColor: 'text-purple-800',
            iconColor: 'text-purple-600',
            descColor: 'text-purple-600'
        },
        orange: {
            gradient: 'from-orange-50 to-amber-50',
            border: 'border-orange-100',
            titleColor: 'text-orange-800',
            iconColor: 'text-orange-600',
            descColor: 'text-orange-600'
        },
        gray: {
            gradient: 'from-gray-50 to-slate-50',
            border: 'border-gray-100',
            titleColor: 'text-gray-800',
            iconColor: 'text-gray-600',
            descColor: 'text-gray-600'
        }
    };

    const config = themeConfigs[theme];

    return (
        <div className={`mb-3 p-4 border-round-lg bg-gradient-to-r ${config.gradient} border-1 ${config.border} shadow-2 ${className}`}>
            <BreadCrumb 
                model={items} 
                home={home}
                className={`custom-breadcrumb custom-breadcrumb-${theme}`}
            />
            <div className="mt-3">
                <h5 className={`font-bold ${config.titleColor} m-0 flex align-items-center gap-2`}>
                    {icon && <i className={`${icon} ${config.iconColor}`}></i>}
                    {title}
                </h5>
                {description && (
                    <p className={`text-sm ${config.descColor} m-0 mt-1`}>{description}</p>
                )}
            </div>
        </div>
    );
};

export default CustomBreadcrumb;
