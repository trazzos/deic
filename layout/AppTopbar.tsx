/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState } from 'react';
import { AppTopbarRef } from '@/types';
import { Menu } from 'primereact/menu';
import { LayoutContext } from './context/layoutcontext';
import { useAuth } from './context/authContext';
import { useRouter } from 'next/navigation'
import { Avatar } from 'primereact/avatar';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenudetailRef = useRef<Menu>(null);
    const topbarmenubuttonRef = useRef(null);
    const { logout, user } =  useAuth();
    const router = useRouter();
    const profilePanelRef = useRef<OverlayPanel>(null);
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

            <button
                type="button"
                ref={topbarmenubuttonRef}
                className="p-link layout-topbar-menu-button layout-topbar-button"
                    onClick={e => profilePanelRef.current?.toggle(e)}
                >
                    <i className="pi pi-user" />
                    <span className="font-semibold text-primary-800 d-none d-md-inline">{user?.nombre || 'Usuario'}</span>
                </button>
            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <button
                type="button"
                className="p-link layout-topbar-button"
                    onClick={e => profilePanelRef.current?.toggle(e)}
                >
                    <i className="pi pi-user" />
                    <span className="font-semibold text-primary-800 d-none d-md-inline">{user?.nombre || 'Usuario'}</span>
                </button>

                <OverlayPanel ref={profilePanelRef} className="p-3" style={{ minWidth: 220, borderRadius: 16 }}>
                    <div className="flex flex-column align-items-center gap-2 mb-3">
                        <Avatar icon="pi pi-user" shape="circle" size="xlarge" className="bg-primary-100 text-primary-700 mb-2" />
                        <span className="font-bold text-lg text-primary-800">{user?.nombre || 'Usuario'}</span>
                        <span className="text-600 text-sm">{user?.email || ''}</span>
                    </div>
                    <Button
                        label="Cerrar sesión"
                        icon="pi pi-sign-out"
                        severity="danger"
                        className="w-full p-button-lg border-round-xl"
                        onClick={handleLogout}
                    />
                </OverlayPanel>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
