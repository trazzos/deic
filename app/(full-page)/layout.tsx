import { Metadata } from 'next';
import AppConfig from '../../layout/AppConfig';
import React from 'react';

interface SimpleLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title:  process.env.NEXT_PUBLIC_TITLE_PAGE,
    description: 'La plataforma de seguimiento de actividades permite a los usuarios gestionar y monitorear sus tareas y proyectos de manera eficiente.'
};

export default function SimpleLayout({ children }: SimpleLayoutProps) {
    return (
        <React.Fragment>
            {children}
            <AppConfig simple />
        </React.Fragment>
    );
}
