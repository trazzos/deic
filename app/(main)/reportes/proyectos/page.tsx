'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { Skeleton } from 'primereact/skeleton';
import * as XLSX from 'xlsx';

import { CustomBreadcrumb } from '@/src/components/CustomBreadcrumb';
import { usePermissions } from '@/src/hooks/usePermissions';
import { useNotification } from '@/layout/context/notificationContext';
import { 
    ReporteService,
    TipoProyectoService,
} from '@/src/services';
import type { ReporteTipoProyecto, ReporteProyecto, ActividadReporte, ActividadDetalle, FiltrosReporte } from '@/types';

export default function ReportesPage() {
    const [loading, setLoading] = useState(false);
    const [reporteData, setReporteData] = useState<ReporteTipoProyecto[]>([]);
    const [tiposProyecto, setTiposProyecto] = useState<any[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [filtros, setFiltros] = useState<FiltrosReporte>({
        fecha_inicio: null,
        fecha_fin: null,
        tipo_proyecto_id: null,
        estatus: null
    });

    const toast = useRef<Toast>(null);
    const { hasPermission } = usePermissions();
    const { showSuccess, showError } = useNotification();

    const estatusOptions = [
        { label: 'Todos', value: null },
        { label: 'Completado', value: 'completado' },
        { label: 'En curso', value: 'en_curso' },
        { label: 'Sin iniciar', value: 'pendiente' },
    ];

    const breadcrumbItems = [
        { label: 'Reportes', url: '/reportes/index' },
        { label: 'Centro de reportes', url: '/reportes/index' },
        { label: 'Proyectos' }
    ];

    const cargarCatalogos = async () => {
        try {
            const [tiposResponse] = await Promise.all([
                TipoProyectoService.getListTipoProyecto(),
            ]);

            setTiposProyecto([
                { label: 'Todos', value: null },
                ...tiposResponse.data.map((tipo: any) => ({
                    label: tipo.nombre,
                    value: tipo.id
                }))
            ]);

        } catch (error) {
            console.error('Error cargando catálogos:', error);
        }
    };

    const cargarReporteProyectos = useCallback(async () => {
        setLoading(true);
        try {
            const response = await ReporteService.getReporteActividadesAgrupadoPorTipoProyecto(filtros);
            const data =  response.data;
            setReporteData(data?.data_reporte ?? []);
        } catch (error) {
            showError('Error al cargar el reporte de proyectos');
        } finally {
            setLoading(false);
        }
    }, [showError, filtros]);

    useEffect(() => {
        cargarCatalogos();
        cargarReporteProyectos();
    }, [cargarReporteProyectos]);

    

    const aplicarFiltros = () => {
        cargarReporteProyectos();
    };

    const limpiarFiltros = () => {
        setFiltros({
            fecha_inicio: null,
            fecha_fin: null,
            tipo_proyecto_id: null,
            estatus: null,
        });
        cargarReporteProyectos();
    };

    const exportarExcel = () => {
        try {
            const workbook = XLSX.utils.book_new();
            
            // Hoja principal con datos del proyecto
            const wsData = reporteData.map(item => ({
                'Tipo proyecto': item.tipo_proyecto.nombre,
                'Actividades proyectadas':item.estadisticas.total_actividades.toLocaleString(),
                'Actividades alcanzadas': item.estadisticas.actividades_completadas.toLocaleString(),
                'Estatus': item.estadisticas.porcentaje_completado + "%",
                'Beneficiados': item.beneficiados.toLocaleString(),
            }));

            const ws = XLSX.utils.json_to_sheet(wsData);
            XLSX.utils.book_append_sheet(workbook, ws, 'Reporte por tipo de proyecto');

            // Generar archivo
            const fileName = `reporte-proyectos-${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            showSuccess('Reporte exportado correctamente');
        } catch (error) {
            console.error('Error exportando reporte:', error);
            showError('Error al exportar el reporte');
        }
    };

    const renderProgreso = (rowData: ReporteProyecto) => {
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

    const renderEstatusProgreso = (rowData: ReporteTipoProyecto) => {
        return (
            <div className="flex align-items-center gap-2">
                <ProgressBar 
                    value={rowData.estadisticas.porcentaje_completado} 
                    style={{ width: '100px', height: '0.5rem' }}
                    showValue={false}
                />
                <span className="text-sm">{rowData.estadisticas.porcentaje_completado}%</span>
            </div>
        );
    };


    const renderEstatus = (rowData: ReporteProyecto) => {
        const getSeverity = (estatus: string) => {
            switch (estatus) {
                case 'Activo': return 'info';
                case 'Completado': return 'success';
                case 'En Pausa': return 'warning';
                case 'Cancelado': return 'danger';
                default: return 'info';
            }
        };

        return <Tag value={rowData.estatus} severity={getSeverity(rowData.estatus)} />;
    };

    const renderActividades = (rowData: ReporteProyecto) => {
        return (
            <div className="flex align-items-center gap-2">
                <Badge value={rowData.actividades_completadas} severity="success" />
                <span>/</span>
                <Badge value={rowData.total_actividades} severity="info" />
            </div>
        );
    };

    const renderIndicadores = (rowData: ReporteProyecto) => {
        const porcentajeAlcanzado = rowData.proyectado > 0 
            ? Math.round((rowData.alcanzado / rowData.proyectado) * 100) 
            : 0;

        return (
            <div className="flex flex-column gap-1">
                <div className="flex justify-content-between">
                    <span className="text-xs text-color-secondary">Proyectado:</span>
                    <span className="text-sm font-semibold">{rowData.proyectado.toLocaleString()}</span>
                </div>
                <div className="flex justify-content-between">
                    <span className="text-xs text-color-secondary">Alcanzado:</span>
                    <span className="text-sm font-semibold">{rowData.alcanzado.toLocaleString()}</span>
                </div>
                <div className="flex justify-content-between">
                    <span className="text-xs text-color-secondary">Eficiencia:</span>
                    <span className={`text-sm font-semibold ${porcentajeAlcanzado >= 80 ? 'text-green-500' : porcentajeAlcanzado >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {porcentajeAlcanzado}%
                    </span>
                </div>
            </div>
        );
    };

    const renderBeneficiados = (rowData: ReporteTipoProyecto) => {
        return (
            <div className="flex flex-column gap-1">
                {rowData.beneficiados.detalles.map((b:any, index:number) => (
                    <div key={index} className="flex justify-content-between">
                        <span className="text-sm text-color-secondary">{b.nombre}:</span>
                        <span className="text-sm font-semibold">{b.total.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        );  
    };

    /*
    const resumenGeneral = () => {
        const totalProyectos = reporteData.length;
        const proyectosActivos = reporteData.filter(p => p.estatus === 'Activo').length;
        const proyectosCompletados = reporteData.filter(p => p.estatus === 'Completado').length;
        const promedioAvance = totalProyectos > 0 
            ? Math.round(reporteData.reduce((sum, p) => sum + p.porcentaje_avance, 0) / totalProyectos)
            : 0;
        const totalBeneficiados = reporteData.reduce((sum, p) => sum + p.beneficiados, 0);

        return (
            <div className="grid">
                <div className="col-12 md:col-3">
                    <Card className="text-center">
                        <h3 className="m-0 text-3xl text-blue-500">{totalProyectos}</h3>
                        <p className="m-0 text-color-secondary">Total Proyectos</p>
                    </Card>
                </div>
                <div className="col-12 md:col-3">
                    <Card className="text-center">
                        <h3 className="m-0 text-3xl text-green-500">{proyectosActivos}</h3>
                        <p className="m-0 text-color-secondary">Activos</p>
                    </Card>
                </div>
                <div className="col-12 md:col-3">
                    <Card className="text-center">
                        <h3 className="m-0 text-3xl text-orange-500">{proyectosCompletados}</h3>
                        <p className="m-0 text-color-secondary">Completados</p>
                    </Card>
                </div>
                <div className="col-12 md:col-3">
                    <Card className="text-center">
                        <h3 className="m-0 text-3xl text-purple-500">{totalBeneficiados.toLocaleString()}</h3>
                        <p className="m-0 text-color-secondary">Beneficiados</p>
                    </Card>
                </div>
            </div>
        );
    };*/

    if (!hasPermission('reportes.proyectos')) {
        return (
            <div className="surface-ground px-4 py-8 md:px-6 lg:px-8">
                <div className="text-center">
                    <i className="pi pi-lock text-6xl text-color-secondary mb-3"></i>
                    <h3>Acceso Denegado</h3>
                    <p className="text-color-secondary">No tienes permisos para ver el reporte de proyectos.</p>
                </div>
            </div>
        );
    }

    const renderHeader = () => {
        return (
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-start gap-3">
                    <div></div>
                    <div className="flex gap-2">
                        <Button
                            icon="pi pi-download"
                            label="Exportar Excel"
                            severity="success"
                            onClick={exportarExcel}
                            disabled={loading || reporteData.length === 0}
                        />
                        <Button
                            icon="pi pi-refresh"
                            label="Actualizar"
                            onClick={cargarReporteProyectos}
                            loading={loading}
                        />
                    </div>
                </div>
        )
    }

    return (
        // px-4 md:px-6 lg:px-8
        <div className="surface-ground">
            <Toast ref={toast} />
            
            <div className="flex flex-column gap-4">
                <CustomBreadcrumb 
                    items={breadcrumbItems}
                    theme="blue"
                    title="Reporte de Proyectos"
                    description="Análisis detallado del progreso y resultados de proyectos"
                />

                

                {/* Resumen General */}
                {/*!loading && reporteData.length > 0 && (
                    <Panel header="Resumen General" className="mb-4">
                        {resumenGeneral()}
                    </Panel>
                ) */}

                {/* Filtros */}
                <Panel header="Filtros de Búsqueda" toggleable collapsed>
                    <div className="grid formgrid p-fluid">
                        <div className="field col-12 md:col-3">
                            <label htmlFor="fechaInicio">Fecha Inicio</label>
                            <Calendar
                                id="fechaInicio"
                                value={filtros.fecha_inicio}
                                onChange={(e) => setFiltros({...filtros, fecha_inicio: e.value || null})}
                                showIcon
                                dateFormat="dd/mm/yy"
                                placeholder="Seleccionar fecha"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label htmlFor="fechaFin">Fecha Fin</label>
                            <Calendar
                                id="fechaFin"
                                value={filtros.fecha_fin}
                                onChange={(e) => setFiltros({...filtros, fecha_fin: e.value || null})}
                                showIcon
                                dateFormat="dd/mm/yy"
                                placeholder="Seleccionar fecha"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label htmlFor="tipoProyecto">Tipo de Proyecto</label>
                            <Dropdown
                                id="tipoProyecto"
                                value={filtros.tipo_proyecto_id}
                                options={tiposProyecto}
                                onChange={(e) => setFiltros({...filtros, tipo_proyecto_id: e.value})}
                                placeholder="Seleccionar tipo"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label htmlFor="estatus">Estatus de avance</label>
                            <Dropdown
                                id="estatus"
                                value={filtros.estatus}
                                options={estatusOptions}
                                onChange={(e) => setFiltros({...filtros, estatus: e.value})}
                                placeholder="Seleccionar estatus"
                            />
                        </div>
                        <div className="field col-12 md:col-3 flex align-items-end">
                            <div className="flex gap-2 w-full">
                                <Button
                                    icon="pi pi-search"
                                    label="Filtrar"
                                    onClick={aplicarFiltros}
                                    loading={loading}
                                    className="flex-1"
                                />
                                <Button
                                    icon="pi pi-times"
                                    severity="secondary"
                                    onClick={limpiarFiltros}
                                    tooltip="Limpiar filtros"
                                />
                            </div>
                        </div>
                    </div>
                </Panel>

                {/* Tabla de Datos */}
                <div className="bg-white border border-gray-200 overflow-hidden border-round-xl shadow-2">
                    <DataTable
                        value={reporteData}
                        loading={loading}
                        scrollable
                        scrollHeight="60vh"
                        stripedRows
                        emptyMessage="No se encontraron registros"
                        header={renderHeader()}
                    >
                        <Column 
                            field="nombre" 
                            header="Tipo de proyecto" 
                            style={{ minWidth: '200px' }}
                            body={(rowData) => (
                                <div>
                                    <div className="font-medium">{rowData.tipo_proyecto.nombre}</div>
                                </div>
                            )}
                        />
                        <Column 
                            field="estadisticas.total_actividades" 
                            header="Actividades proyectadas" 
                            body={(rowData) => (
                                <div>
                                    <div className="font-medium">{rowData.estadisticas.total_actividades.toLocaleString()}</div>
                                </div>
                            )}
                            style={{ minWidth: '150px' }}
                        />
                         <Column 
                            field="estadisticas.actividades_completadas" 
                            header="Actividades alcanzadas" 
                            body={(rowData) => (
                                <div>
                                    <div className="font-medium">{rowData.estadisticas.actividades_completadas.toLocaleString()}</div>
                                </div>
                            )}
                            style={{ minWidth: '150px' }}
                        />
                        <Column 
                            header="Porcentaje de avance" 
                            body={renderEstatusProgreso}
                            style={{ minWidth: '150px' }}
                        />
                      
                        <Column 
                            field="beneficiados" 
                            header="Beneficiados"
                            body={ renderBeneficiados}
                            style={{ minWidth: '120px' }}
                        />
                        
                    </DataTable>
                </div>
            </div>
        </div>
    );
}
