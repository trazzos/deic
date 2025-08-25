/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';
import { AppMenuItem } from '@/types';
import { usePermissions } from '@/src/hooks/usePermissions';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { hasPermission, isSuperAdmin, userRoles } = usePermissions();
    

    // Función para filtrar items del menú basado en permisos
    const filterMenuItems = (items: AppMenuItem[]): AppMenuItem[] => {
        return items.filter(item => {
            // Si el item tiene subitems, filtrarlos recursivamente
            if (item.items) {
                const filteredSubItems = filterMenuItems(item.items);
                if (filteredSubItems.length === 0) {
                    return false; // Si no hay subitems válidos, ocultar el item padre
                }
                item.items = filteredSubItems;
            }

            if (isSuperAdmin) return true; // SuperAdmin ve todo

            if (item.superAdminOnly) return false;

            if (item.permission && item.permission !== '') {
                return hasPermission(item.permission);
            }
            
            if (item.permissions && item.permissions.length > 0) {
                return item.permissions.some(perm => hasPermission(perm));
            }
            
            return true;
        });
    };

    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }],
            permissions: ['dashboard'],
        },
        {
            label: 'Catálogos',
            icon: 'pi pi-fw pi-th-large',
            items: [
                { label: 'Autoridades', icon: 'pi pi-fw pi-th-large', to: '/catalogos/autoridad', permissions: ['catalogos.autoridades'] },
                { label: 'Beneficiarios', icon: 'pi pi-fw pi-th-large', to: '/catalogos/beneficiario', permissions: ['catalogos.beneficiarios'] },
                { label: 'Capacitadores', icon: 'pi pi-fw pi-th-large', to: '/catalogos/capacitador', permissions: ['catalogos.capacitadores'] },
                { label: 'Departamentos', icon: 'pi pi-fw pi-th-large', to: '/catalogos/departamento', permissions: ['catalogos.departamentos'] },
                { label: 'Organización', icon: 'pi pi-fw pi-building', to: '/catalogos/organizacion', permissions: ['catalogos.organizacion'] },
                { label: 'Tipos de actividad', icon: 'pi pi-fw pi-th-large', to: '/catalogos/tipo-actividad', permissions: ['catalogos.tipos_actividad'] },
                { label: 'Tipos de documento', icon: 'pi pi-fw pi-th-large', to: '/catalogos/tipo-documento', permissions: ['catalogos.tipos_documento'] },
                { label: 'Tipos de proyecto', icon: 'pi pi-fw pi-th-large', to: '/catalogos/tipo-proyecto', permissions: ['catalogos.tipos_proyecto'] },
            ],
            permissions: ['catalogos'],

        },
        {
            label: 'Gestión de cuentas',
            icon: 'pi pi-fw pi-users',
            items:[
                { label: 'Roles de usuario', icon: 'pi pi-fw pi-key', to: '/roles', permissions:['gestion_cuentas.roles']},
                { label: 'Personas', icon: 'pi pi-fw pi-users', to: '/personas', permissions:['gestion_cuentas.personas']},
            ],
            permissions:['gestion_cuentas']
        },

        {
            label: 'Gestión de proyectos',
            items: [
                { label: 'Proyectos', icon: 'pi pi-fw pi-sliders-h', to: '/proyectos', permissions: ['gestion_proyectos.proyectos'] },
            ],
            permissions: ['gestion_proyectos']    
        },
         {
            label: 'Reportes',
            items: [
                { label: 'Centro de Reportes', icon: 'pi pi-fw pi-chart-bar', to: '/reportes/index', permissions: ['reportes.ver'] },
            ],
            permissions: ['reportes']
        },
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {filterMenuItems(model).map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}

            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
