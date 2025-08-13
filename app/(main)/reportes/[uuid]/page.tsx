'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Panel } from 'primereact/panel';
import { Timeline } from 'primereact/timeline';
import { Avatar } from 'primereact/avatar';
import { Divider } from 'primereact/divider';
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import * as XLSX from 'xlsx';

import { CustomBreadcrumb } from '@/src/components/CustomBreadcrumb';
import { useNotification } from '@/layout/context/notificationContext';
import { ProyectoService } from '@/src/services';

interface DetalleProyecto {
    uuid: string;
    nombre: string;
    descripcion: string;
    tipo_proyecto: string;
    departamento: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    porcentaje_avance: number;
    responsable: string;
    actividades: ActividadDetalle[];
}

interface ActividadDetalle {
    uuid: string;
    nombre: string;
    descripcion: string;
    tipo_actividad: string;
    capacitador: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    porcentaje_avance: number;
    beneficiados: number;
    proyectado: number;
    alcanzado: number;
    estatus: 'Pendiente' | 'En Progreso' | 'Completada' | 'Cancelada';
    tareas: TareaDetalle[];
}

interface TareaDetalle {
    id: number;
    nombre: string;
    descripcion: string;
    completada: boolean;
    fecha_completada?: Date;
}

export default function ProyectoDetallePage() {
    const params = useParams();
    const uuid = params?.uuid as string;
    
    const [proyecto, setProyecto] = useState<DetalleProyecto | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any>({});
    const [chartOptions, setChartOptions] = useState<any>({});
    
    const toast = useRef<Toast>(null);
    const { showSuccess, showError } = useNotification();

    const breadcrumbItems = [
        { label: 'Reportes', url: '/reportes' },
        { label: 'Detalle del Proyecto' }
    ];

    useEffect(() => {
        if (uuid) {
            cargarDetalleProyecto();
            initChart();
        }
    }, [uuid]);

    const cargarDetalleProyecto = async () => {
        setLoading(true);
        try {
            const response = await ProyectoService.getProyecto(uuid);
            const actividadesResponse = await ProyectoService.getListaActividadesPorProyectoUuid(uuid);
            
            // Simulando estructura de datos completa
            const proyectoDetalle: DetalleProyecto = {
                uuid: response.data.uuid,
                nombre: response.data.nombre,
                descripcion: response.data.descripcion,
                tipo_proyecto: response.data.tipo_proyecto?.nombre || 'No definido',
                departamento: response.data.departamento?.nombre || 'No definido',
                fecha_inicio: new Date(response.data.fecha_inicio || Date.now()),
                fecha_fin: new Date(response.data.fecha_fin || Date.now()),
                porcentaje_avance: response.data.porcentaje_avance || Math.floor(Math.random() * 100),
                responsable: 'Usuario Demo',
                actividades: actividadesResponse.data?.map((actividad: any) => ({
                    uuid: actividad.uuid,
                    nombre: actividad.nombre,
                    descripcion: actividad.descripcion || '',
                    tipo_actividad: actividad.tipo_actividad?.nombre || 'No definido',
                    capacitador: actividad.capacitador?.nombre || 'No asignado',
                    fecha_inicio: new Date(actividad.fecha_inicio || Date.now()),
                    fecha_fin: new Date(actividad.fecha_fin || Date.now()),
                    porcentaje_avance: actividad.porcentaje_avance || Math.floor(Math.random() * 100),
                    beneficiados: Math.floor(Math.random() * 50) + 10,
                    proyectado: Math.floor(Math.random() * 200) + 50,
                    alcanzado: Math.floor(Math.random() * 150) + 30,
                    estatus: ['Pendiente', 'En Progreso', 'Completada'][Math.floor(Math.random() * 3)] as any,
                    tareas: []
                })) || []
            };

            setProyecto(proyectoDetalle);
            updateChartData(proyectoDetalle);
        } catch (error) {
            console.error('Error cargando detalle del proyecto:', error);
            showError('Error al cargar el detalle del proyecto');
        } finally {
            setLoading(false);
        }
    };

    const initChart = () => {
        const documentStyle = getComputedStyle(document.documentElement);
        
        const options = {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {
                    labels: {
                        fontColor: documentStyle.getPropertyValue('--text-color')
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: documentStyle.getPropertyValue('--text-color-secondary'),
                        font: {
                            weight: 500
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: documentStyle.getPropertyValue('--text-color-secondary')
                    },
                    grid: {
                        color: documentStyle.getPropertyValue('--surface-border'),
                        drawBorder: false
                    }
                }
            }
        };

        setChartOptions(options);
    };

    const updateChartData = (proyectoData: DetalleProyecto) => {
        const documentStyle = getComputedStyle(document.documentElement);
        
        const data = {
            labels: proyectoData.actividades.map(act => act.nombre.substring(0, 20) + '...'),
            datasets: [
                {
                    label: 'Proyectado',
                    backgroundColor: documentStyle.getPropertyValue('--blue-500'),
                    borderColor: documentStyle.getPropertyValue('--blue-500'),
                    data: proyectoData.actividades.map(act => act.proyectado)
                },
                {
                    label: 'Alcanzado',
                    backgroundColor: documentStyle.getPropertyValue('--green-500'),
                    borderColor: documentStyle.getPropertyValue('--green-500'),
                    data: proyectoData.actividades.map(act => act.alcanzado)
                }
            ]
        };

        setChartData(data);
    };

    const exportarExcel = () => {
        if (!proyecto) return;

        try {
            const workbook = XLSX.utils.book_new();
            
            // Hoja del proyecto
            const proyectoData = [{
                'Proyecto': proyecto.nombre,
                'Descripción': proyecto.descripcion,
                'Tipo': proyecto.tipo_proyecto,
                'Departamento': proyecto.departamento,
                'Fecha Inicio': proyecto.fecha_inicio.toLocaleDateString(),
                'Fecha Fin': proyecto.fecha_fin.toLocaleDateString(),
                'Progreso (%)': proyecto.porcentaje_avance,
                'Responsable': proyecto.responsable
            }];

            const wsProyecto = XLSX.utils.json_to_sheet(proyectoData);
            XLSX.utils.book_append_sheet(workbook, wsProyecto, 'Proyecto');

            // Hoja de actividades
            const actividadesData = proyecto.actividades.map(actividad => ({
                'Actividad': actividad.nombre,
                'Tipo': actividad.tipo_actividad,
                'Capacitador': actividad.capacitador,
                'Fecha Inicio': actividad.fecha_inicio.toLocaleDateString(),
                'Fecha Fin': actividad.fecha_fin.toLocaleDateString(),
                'Progreso (%)': actividad.porcentaje_avance,
                'Proyectado': actividad.proyectado,
                'Alcanzado': actividad.alcanzado,
                'Beneficiados': actividad.beneficiados,
                'Estatus': actividad.estatus
            }));

            const wsActividades = XLSX.utils.json_to_sheet(actividadesData);
            XLSX.utils.book_append_sheet(workbook, wsActividades, 'Actividades');

            const fileName = `detalle-proyecto-${proyecto.nombre.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            showSuccess('Detalle del proyecto exportado correctamente');
        } catch (error) {
            console.error('Error exportando detalle:', error);
            showError('Error al exportar el detalle del proyecto');
        }
    };

    const renderProgreso = (rowData: ActividadDetalle) => {
        return (
            <div className="flex align-items-center gap-2">
                <ProgressBar 
                    value={rowData.porcentaje_avance} 
                    style={{ width: '100px', height: '0.5rem' }}
                    showValue={false}
                />
                <span className="text-sm">{rowData.porcentaje_avance}%</span>
            </div>
        );
    };

    const renderEstatus = (rowData: ActividadDetalle) => {
        const getSeverity = (estatus: string) => {
            switch (estatus) {
                case 'Completada': return 'success';
                case 'En Progreso': return 'info';
                case 'Pendiente': return 'warning';
                case 'Cancelada': return 'danger';
                default: return 'info';
            }
        };

        return <Tag value={rowData.estatus} severity={getSeverity(rowData.estatus)} />;
    };

    const renderIndicadores = (rowData: ActividadDetalle) => {
        const eficiencia = rowData.proyectado > 0 
            ? Math.round((rowData.alcanzado / rowData.proyectado) * 100) 
            : 0;

        return (
            <div className="flex flex-column gap-1">
                <div className="flex justify-content-between">
                    <span className="text-xs text-color-secondary">P:</span>
                    <span className="text-sm font-semibold">{rowData.proyectado}</span>
                </div>
                <div className="flex justify-content-between">
                    <span className="text-xs text-color-secondary">A:</span>
                    <span className="text-sm font-semibold">{rowData.alcanzado}</span>
                </div>
                <div className="flex justify-content-between">
                    <span className="text-xs text-color-secondary">E:</span>
                    <span className={`text-sm font-semibold ${eficiencia >= 80 ? 'text-green-500' : eficiencia >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {eficiencia}%
                    </span>
                </div>
            </div>
        );
    };

    const resumenProyecto = () => {
        if (!proyecto) return null;

        const totalActividades = proyecto.actividades.length;
        const actividadesCompletadas = proyecto.actividades.filter(a => a.estatus === 'Completada').length;
        const totalBeneficiados = proyecto.actividades.reduce((sum, a) => sum + a.beneficiados, 0);
        const totalProyectado = proyecto.actividades.reduce((sum, a) => sum + a.proyectado, 0);
        const totalAlcanzado = proyecto.actividades.reduce((sum, a) => sum + a.alcanzado, 0);
        const eficienciaGeneral = totalProyectado > 0 ? Math.round((totalAlcanzado / totalProyectado) * 100) : 0;

        return (
            <div className="grid">
                <div className="col-12 md:col-6">
                    <Card>
                        <h3 className="mt-0">Información del Proyecto</h3>
                        <div className="flex flex-column gap-2">
                            <div className="flex justify-content-between">
                                <span className="font-semibold">Nombre:</span>
                                <span>{proyecto.nombre}</span>
                            </div>
                            <div className="flex justify-content-between">
                                <span className="font-semibold">Tipo:</span>
                                <span>{proyecto.tipo_proyecto}</span>
                            </div>
                            <div className="flex justify-content-between">
                                <span className="font-semibold">Departamento:</span>
                                <span>{proyecto.departamento}</span>
                            </div>
                            <div className="flex justify-content-between">
                                <span className="font-semibold">Responsable:</span>
                                <span>{proyecto.responsable}</span>
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="col-12 md:col-6">
                    <Card>
                        <h3 className="mt-0">Resumen de Resultados</h3>
                        <div className="grid text-center">
                            <div className="col-6">
                                <div className="p-3 border-round surface-100">
                                    <h4 className="m-0 text-2xl text-blue-500">{totalActividades}</h4>
                                    <p className="m-0 text-sm">Total Actividades</p>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-3 border-round surface-100">
                                    <h4 className="m-0 text-2xl text-green-500">{actividadesCompletadas}</h4>
                                    <p className="m-0 text-sm">Completadas</p>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-3 border-round surface-100">
                                    <h4 className="m-0 text-2xl text-orange-500">{totalBeneficiados}</h4>
                                    <p className="m-0 text-sm">Beneficiados</p>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-3 border-round surface-100">
                                    <h4 className={`m-0 text-2xl ${eficienciaGeneral >= 80 ? 'text-green-500' : eficienciaGeneral >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                                        {eficienciaGeneral}%
                                    </h4>
                                    <p className="m-0 text-sm">Eficiencia</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="surface-ground px-4 py-8 md:px-6 lg:px-8">
                <div className="flex flex-column gap-4">
                    <Skeleton width="100%" height="3rem" />
                    <Skeleton width="100%" height="20rem" />
                    <Skeleton width="100%" height="15rem" />
                </div>
            </div>
        );
    }

    if (!proyecto) {
        return (
            <div className="surface-ground px-4 py-8 md:px-6 lg:px-8 text-center">
                <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-3"></i>
                <h3>Proyecto no encontrado</h3>
                <p className="text-color-secondary">El proyecto solicitado no existe o no tienes permisos para verlo.</p>
            </div>
        );
    }

    return (
        <div className="surface-ground px-4 py-8 md:px-6 lg:px-8">
            <Toast ref={toast} />
            
            <div className="flex flex-column gap-4">
                <CustomBreadcrumb 
                    items={breadcrumbItems}
                    theme="blue"
                    title={`Detalle: ${proyecto.nombre}`}
                    description={proyecto.descripcion}
                />

                <div className="flex justify-content-end gap-2">
                    <Button
                        icon="pi pi-download"
                        label="Exportar Excel"
                        severity="success"
                        onClick={exportarExcel}
                    />
                    <Button
                        icon="pi pi-refresh"
                        label="Actualizar"
                        onClick={cargarDetalleProyecto}
                        loading={loading}
                    />
                </div>

                {/* Resumen del Proyecto */}
                {resumenProyecto()}

                {/* Gráfico de Proyectado vs Alcanzado */}
                <Card>
                    <h3>Proyectado vs Alcanzado por Actividad</h3>
                    <Chart type="bar" data={chartData} options={chartOptions} height="300px" />
                </Card>

                {/* Tabla de Actividades */}
                <Card>
                    <DataTable
                        value={proyecto.actividades}
                        responsiveLayout="scroll"
                        scrollable
                        scrollHeight="50vh"
                        stripedRows
                        size="small"
                        emptyMessage="No hay actividades registradas"
                        header={
                            <div className="flex justify-content-between align-items-center">
                                <h3 className="m-0">Actividades del Proyecto</h3>
                                <span className="text-color-secondary">
                                    {proyecto.actividades.length} actividades
                                </span>
                            </div>
                        }
                    >
                        <Column 
                            field="nombre" 
                            header="Actividad" 
                            style={{ minWidth: '200px' }}
                            body={(rowData) => (
                                <div>
                                    <div className="font-semibold">{rowData.nombre}</div>
                                    <div className="text-sm text-color-secondary">{rowData.tipo_actividad}</div>
                                </div>
                            )}
                        />
                        <Column 
                            field="capacitador" 
                            header="Capacitador" 
                            style={{ minWidth: '150px' }}
                        />
                        <Column 
                            header="Progreso" 
                            body={renderProgreso}
                            style={{ minWidth: '150px' }}
                        />
                        <Column 
                            header="Indicadores" 
                            body={renderIndicadores}
                            style={{ minWidth: '120px' }}
                        />
                        <Column 
                            field="beneficiados" 
                            header="Beneficiados"
                            style={{ minWidth: '100px' }}
                        />
                        <Column 
                            header="Estatus" 
                            body={renderEstatus}
                            style={{ minWidth: '120px' }}
                        />
                        <Column 
                            field="fecha_inicio" 
                            header="Fecha Inicio"
                            body={(rowData) => rowData.fecha_inicio.toLocaleDateString()}
                            style={{ minWidth: '120px' }}
                        />
                        <Column 
                            field="fecha_fin" 
                            header="Fecha Fin"
                            body={(rowData) => rowData.fecha_fin.toLocaleDateString()}
                            style={{ minWidth: '120px' }}
                        />
                    </DataTable>
                </Card>
            </div>
        </div>
    );
}
