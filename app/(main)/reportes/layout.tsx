'use client';
import PermissionGuard from "@/src/components/PermissionGuard";
import AccessDenied from "@/src/components/AccessDenied";

export default function ReportesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PermissionGuard 
                permission="reportes"
                fallback={<AccessDenied message="No tienes acceso a esta modulo"/>}>
            {children}
        </PermissionGuard>
    );
}
