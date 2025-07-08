/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState } from 'react';
import { AppTopbarRef } from '@/types';
import { Menu } from 'primereact/menu';
import { LayoutContext } from './context/layoutcontext';
import { useAuth } from './context/authContext';
import { useRouter } from 'next/navigation'

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenudetailRef = useRef<Menu>(null);
    const topbarmenubuttonRef = useRef(null);
    const { logout } =  useAuth();
    const router = useRouter();
    const itemsMenu = [
         {
            label: 'Perfil',
            items: [
                {
                    label: 'Cerrar sesión',
                    icon: 'pi pi-logout',
                    command: async () => {
                        await handleLogout();
                    }
                }
            ]
        }
    ]

    const handleLogout = async () => {
        await logout();
        router.push('/auth/login');

    };

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current,
    }));

    return (
        <div className="layout-topbar">
            <Link href="/" className="layout-topbar-logo">
                <img src={`/layout/images/logo-${layoutConfig.colorScheme !== 'light' ? 'white' : 'dark'}.svg`} width="47.22px" height={'35px'} alt="logo" />
                <span></span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef}  className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
               
                <Menu model={itemsMenu} popup ref={topbarmenudetailRef} id="popup_menu_left" />
                 <button type="button" 
                        onClick={(event) => topbarmenudetailRef.current && topbarmenudetailRef.current.toggle(event)}
                        className="p-link layout-topbar-button">
                        <i className="pi pi-user"></i>
                    <span>Perfil</span>
                </button>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
