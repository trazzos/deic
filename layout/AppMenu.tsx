/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);

    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
        },

        {
            label: 'Configuración',
            icon: 'pi pi-fw pi-cogs',
            items:[
                {
                    label:'Catalogos',
                    icon: 'pi pi-th-large',
                    items: [
                            { label: 'Autoridades', icon: 'pi pi-fw pi-th-large', to: '/catalogos/autoridad' },
                            { label: 'Beneficiarios', icon: 'pi pi-fw pi-th-large', to: '/catalogos/beneficiario'},
                            { label: 'Capacitadores', icon: 'pi pi-fw pi-th-large', to: '/catalogos/capacitador'},
                            { label: 'Departamentos', icon: 'pi pi-fw pi-th-large', to: '/catalogos/departamento'},
                            { label: 'Tipos de actividad', icon: 'pi pi-fw pi-th-large', to: '/catalogos/tipo-actividad'},
                            { label: 'Tipos de documento', icon: 'pi pi-fw pi-th-large', to: '/catalogos/tipo-documento'},
                            { label: 'Tipos de proyecto', icon: 'pi pi-fw pi-th-large', to: '/catalogos/tipo-proyecto'},
                    ],
                },
                { label: 'Roles de usuario', icon: 'pi pi-fw pi-key', to: '/roles' },
                { label: 'Cuentas de usuario', icon: 'pi pi-fw pi-shield', to: '/cuentas'},
                { label: 'Personas', icon: 'pi pi-fw pi-users', to: '/personas'},
            ]
        },

        {
            label: 'Proyectos y actividades',
            items: [
                { label: 'Tablero', icon: 'pi pi-fw pi-table', to: '/construccion' },
                { label: 'Proyectos', icon: 'pi pi-fw pi-sliders-h', to: '/proyectos' },
            ]    
        },
         {
            label: 'Reportes',
            items: [
                { label: 'Reporte de proyectos', icon: 'pi pi-fw pi-file', to: '/construccion' },
                { label: 'Reporte de actividades', icon: 'pi pi-fw pi-file', to: '/construccion' },
            ]    
        },
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}

            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
