'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

import { CustomBreadcrumb } from '@/src/components/CustomBreadcrumb';

export default function ReportesIndexPage() {
    const router = useRouter();

    const breadcrumbItems = [
        { label: 'Reportes' },
        { label: 'Centro de reportes' },
    ];

    const reportes = [
        {
            id: 'proyectos',
            titulo: 'Reporte de Proyectos',
            descripcion: 'Análisis detallado del progreso y resultados de todos los proyectos con filtros por fecha, tipo y departamento.',
            icon: 'pi pi-chart-bar',
            ruta: '/reportes/proyectos',
            color: 'blue',
            disponible: true,
        },
        {
            id: 'actividades',
            titulo: 'Reporte de Actividades',
            descripcion: 'Seguimiento de actividades individuales con métricas de cumplimiento y beneficiarios.',
            icon: 'pi pi-list',
            ruta: '/reportes/actividades',
            color: 'green',
            disponible: false
        },
    ];

    const navegarAReporte = (ruta: string, disponible: boolean = true) => {
        if (disponible) {
            router.push(ruta);
        }
    };

    const renderReporteCard = (reporte: any) => {
        const cardHeader = (
            <div className={`p-4 border-round-top  bg-${reporte.color}-500 text-white`}>
                <div className="flex align-items-center gap-3">
                    <i className={`${reporte.icon} text-3xl`}></i>
                    <div>
                        <h3 className="m-0 text-white">{reporte.titulo}</h3>
                        {!reporte.disponible && (
                            <span className="inline-flex align-items-center gap-1 mt-1 text-sm opacity-90">
                                <i className="pi pi-clock"></i>
                                Próximamente
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );

        const cardFooter = (
            <div className="flex justify-content-end">
                <Button
                    label={reporte.disponible !== false ? "Ver Reporte" : "Próximamente"}
                    icon={reporte.disponible !== false ? "pi pi-arrow-right" : "pi pi-clock"}
                    className="p-button-sm"
                    severity={reporte.disponible !== false ? undefined : "secondary"}
                    disabled={reporte.disponible === false}
                    onClick={() => navegarAReporte(reporte.ruta, reporte.disponible !== false)}
                />
            </div>
        );

        return (
            <div key={reporte.id} className="col-12 md:col-6 lg:col-4">
                <Card
                    header={cardHeader}
                    footer={cardFooter}
                    className={`h-full ${reporte.disponible === false ? 'opacity-75' : 'cursor-pointer'} transition-all transition-duration-200 hover:shadow-3`}
                    onClick={() => navegarAReporte(reporte.ruta, reporte.disponible !== false)}
                >
                    <p className="text-color-secondary line-height-3 mb-0">
                        {reporte.descripcion}
                    </p>
                </Card>
            </div>
        );
    };

    return (
        <div className="surface-ground ">
            <div className="flex flex-column gap-4">
                <CustomBreadcrumb 
                    items={breadcrumbItems}
                    theme="blue"
                    title="Centro de Reportes"
                    description="Accede a todos los reportes y análisis del sistema"
                />

                <div className="flex flex-column gap-3">
                    <div className="flex align-items-center justify-content-between">
                        <h2 className="text-2xl font-bold text-color m-0">Reportes Disponibles</h2>
                        <span className="text-color-secondary">
                            {reportes.filter(r => r.disponible !== false).length} de {reportes.length} disponibles
                        </span>
                    </div>
                    
                    <div className="grid">
                        {reportes.map(renderReporteCard)}
                    </div>
                </div>

                {/* Información adicional */}
                <Card className="mt-4">
                    <div className="flex align-items-start gap-3">
                        <i className="pi pi-info-circle text-blue-500 text-xl mt-1"></i>
                        <div>
                            <h4 className="mt-0 mb-2">Información sobre los Reportes</h4>
                            <ul className="text-color-secondary pl-0 list-none">
                                <li className="flex align-items-center gap-2 mb-2">
                                    <i className="pi pi-check-circle text-green-500"></i>
                                    Todos los reportes incluyen capacidad de exportación a Excel
                                </li>
                                <li className="flex align-items-center gap-2 mb-2">
                                    <i className="pi pi-check-circle text-green-500"></i>
                                    Los datos se actualizan en tiempo real
                                </li>
                                <li className="flex align-items-center gap-2 mb-2">
                                    <i className="pi pi-check-circle text-green-500"></i>
                                    Filtros avanzados disponibles para personalizar la información
                                </li>
                                <li className="flex align-items-center gap-2">
                                    <i className="pi pi-check-circle text-green-500"></i>
                                    Acceso controlado por permisos de usuario
                                </li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
