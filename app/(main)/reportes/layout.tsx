'use client';
import { useAuth } from '@/layout/context/authContext';
import { PermissionGuard } from '@/src/components/PermissionGuard';

export default function ReportesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PermissionGuard permission="reportes.ver">
            {children}
        </PermissionGuard>
    );
}
