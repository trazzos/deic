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
    const { logout, user, userRoles } =  useAuth();
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
                <img src={`/layout/images/logo.png`} width="145px" height={'45px'} alt="logo" />
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
                    <i className="pi pi-ellipsis-v" />
                </button>
            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <button
                    type="button"
                    className="p-link layout-topbar-button layout-topbar-profile-button"
                    onClick={e => profilePanelRef.current?.toggle(e)}
                >
                    <div className="layout-topbar-profile-content">
                        <Avatar 
                            image={user?.url_img_profile || undefined}
                            icon={!user?.url_img_profile && !user?.name ? "pi pi-user" : undefined}
                            label={!user?.url_img_profile && user?.name ? 
                                user.name.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2) : 
                                undefined
                            }
                            shape="circle" 
                            size="normal" 
                            className="layout-topbar-avatar"
                            style={{
                                backgroundColor: !user?.url_img_profile && user?.name ? '#6366f1' : undefined,
                                color: !user?.url_img_profile && user?.name ? 'white' : undefined
                            }}
                        />
                        <div className="layout-topbar-profile-text">
                            <span className="layout-topbar-profile-name">{user?.name || 'Usuario'}</span>
                            <span className="layout-topbar-profile-role">{userRoles?.[0] || 'Sin rol'}</span>
                        </div>
                        <i className="pi pi-chevron-down layout-topbar-profile-icon" />
                    </div>
                </button>

                <OverlayPanel ref={profilePanelRef} className="p-3" style={{ minWidth: 280, borderRadius: 16 }}>
                    <div className="flex flex-column align-items-center gap-2 mb-3">
                        <Avatar 
                            image={user?.url_img_profile || undefined}
                            icon={!user?.url_img_profile && !user?.name ? "pi pi-user" : undefined}
                            label={!user?.url_img_profile && user?.name ? 
                                user.name.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2) : 
                                undefined
                            }
                            shape="circle" 
                            size="xlarge" 
                            className="mb-2"
                            style={{
                                backgroundColor: !user?.url_img_profile && user?.name ? '#6366f1' : (!user?.url_img_profile ? '#e2e8f0' : undefined),
                                color: !user?.url_img_profile && user?.name ? 'white' : (!user?.url_img_profile ? '#6366f1' : undefined)
                            }}
                        />
                        <span className="font-bold text-lg text-primary-800">{user?.name || 'Usuario'}</span>
                        <span className="text-600 text-sm">{user?.email || ''}</span>
                        {userRoles && userRoles.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-content-center">
                                {userRoles.slice(0, 3).map((role: string, index: number) => (
                                    <span key={index} className="text-500 text-xs bg-primary-50 px-2 py-1 border-round-lg">
                                        {role}
                                    </span>
                                ))}
                                {userRoles.length > 3 && (
                                    <span className="text-500 text-xs bg-gray-100 px-2 py-1 border-round-lg">
                                        +{userRoles.length - 3} más
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-column gap-2">
                        {/*
                        <Button
                            label="Ver Perfil"
                            icon="pi pi-user"
                            severity="secondary"
                            outlined
                            className="w-full p-button-sm border-round-xl"
                            onClick={() => {
                                profilePanelRef.current?.hide();
                                // Aquí puedes agregar navegación al perfil
                            }}
                        />*/}
                        <Button
                            label="Cerrar sesión"
                            icon="pi pi-sign-out"
                            severity="danger"
                            className="w-full p-button-sm border-round-xl"
                            onClick={handleLogout}
                        />
                    </div>
                </OverlayPanel>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
