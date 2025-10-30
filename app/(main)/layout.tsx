import { Metadata } from 'next';
import Layout from '../../layout/layout';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: process.env.NEXT_PUBLIC_TITLE_PAGE,
    description: 'La plataforma de seguimiento de actividades permite a los usuarios gestionar y monitorear sus tareas y proyectos de manera eficiente.',
    robots: { index: false, follow: false },
    //viewport: { initialScale: 1, width: 'device-width' },
    openGraph: {
        type: 'website',
        title: process.env.NEXT_PUBLIC_TITLE_PAGE,
        url: 'https://codisoft.com.mx/',
        description: 'Sistema de seguimiento de actividades.',
        images: ['https://www.primefaces.org/static/social/sakai-react.png'],
        ttl: 604800
    },
    icons: {
        icon: '/favicon.ico'
    }
};
export const viewport = { initialScale: 1, width: 'device-width' };
export default function AppLayout({ children }: AppLayoutProps) {
    return <Layout>{children}</Layout>;
}
