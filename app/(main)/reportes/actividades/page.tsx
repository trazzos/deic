'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { Skeleton } from 'primereact/skeleton';

import { CustomBreadcrumb } from '@/src/components/CustomBreadcrumb';
import { PermissionGuard } from '@/src/components/PermissionGuard';
import { AccessDenied } from '@/src/components/AccessDenied';
import { usePermissions } from "@/src/hooks/usePermissions";
import { ReporteService } from '@/src/services/reportes';
import { TipoProyectoService } from '@/src/services/catalogos';

export default function ReporteActividadesPage() {
    const router = useRouter();
    const { hasPermission } = usePermissions();
    const toast = useRef<Toast>(null);

    // Estados para filtros
    const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
    const [fechaFin, setFechaFin] = useState<Date | null>(null);
    const [tiposProyecto, setTiposProyecto] = useState([]);
    const [tiposProyectoSeleccionados, setTiposProyectoSeleccionados] = useState([]);
    const [estatusSeleccionado, setEstatusSeleccionado] = useState([]);

    // Estados para datos
    const [actividades, setActividades] = useState<any[]>([]);
    const [resumenActividades, setResumenActividades] = useState({
        completadas: 0,
        enCurso: 0,
        pendiente: 0
    });
    const [loading, setLoading] = useState(false);
    const [loadingCatalogos, setLoadingCatalogos] = useState(true);

    // Estados para diálogo de detalles
    const [actividadesDetalle, setActividadesDetalle] = useState<any[]>([]);
    const [tipoDetalleSeleccionado, setTipoDetalleSeleccionado] = useState('');
    const [showFiltros, setShowFiltros] = useState(false);
    const [showDetalle, setShowDetalle] = useState(false);

    const breadcrumbItems = [
        { label: 'Reportes', command: () => router.push('/reportes') },
        { label: 'Reporte de Actividades' },
    ];

    const estatusOptions = [
        { label: 'Completado', value: 'completado' },
        { label: 'En curso', value: 'en_curso' },
        { label: 'Sin comenzar', value: 'pendiente' }
    ];

    // Función para determinar si una actividad está vencida
    const isActividadVencida = (actividad: any) => {
        if (!actividad.fecha_fin) return false;
        const fechaFin = new Date(actividad.fecha_fin);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaFin.setHours(0, 0, 0, 0);
        return fechaFin < hoy;
    };

    // Función para determinar el estatus de una actividad
    const determinarEstatusActividad = (actividad: any) => {
        // Con la nueva estructura, si tiene completed_at es completada
        if (actividad.completed_at) {
            return 'completado';
        }
        
        // Si no está completada, verificar porcentaje de avance de tareas
        const porcentajeAvance = actividad.porcentaje_avance_tareas || 0;
        
        if (porcentajeAvance > 0) {
            return 'en_curso';
        } else {
            return 'pendiente';
        }
    };

    // Cargar catálogos al montar el componente
    useEffect(() => {
        cargarCatalogos();
    }, []);

    const cargarCatalogos = async () => {
        try {
            setLoadingCatalogos(true);
            const tiposResponse = await TipoProyectoService.getListTipoProyecto();
            setTiposProyecto(tiposResponse.data || []);
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar los catálogos'
            });
        } finally {
            setLoadingCatalogos(false);
        }
    };

    const buscarActividades = async () => {
        try {
            setLoading(true);
            
            // Construir filtros
            const filtros: any = {};
            
            if (fechaInicio) {
                filtros.fecha_inicio = fechaInicio.toISOString().split('T')[0];
            }
            
            if (fechaFin) {
                filtros.fecha_fin = fechaFin.toISOString().split('T')[0];
            }
            
            if (tiposProyectoSeleccionados.length > 0) {
                filtros.tipos_proyecto = tiposProyectoSeleccionados.map((t: any) => t.id);
            }

            // Obtener datos con la nueva estructura
            const response = await ReporteService.getReporteActividades(filtros);
            const data = response.data || {};

            // Extraer actividades de cada categoría
            const completadas = data.completadas?.actividades || [];
            const enCurso = data.en_curso?.actividades || [];
            const pendientes = data.pendiente?.actividades || [];

            // Combinar todas las actividades para el estado general
            const todasLasActividades = [...completadas, ...enCurso, ...pendientes];

            // Filtrar por estatus si está seleccionado
            let actividadesFiltradas = todasLasActividades;
            if (estatusSeleccionado.length > 0) {
                const estatusValores = estatusSeleccionado.map((e: any) => e.value);
                actividadesFiltradas = [];
                
                if (estatusValores.includes('completado')) {
                    actividadesFiltradas.push(...completadas);
                }
                if (estatusValores.includes('en_curso')) {
                    actividadesFiltradas.push(...enCurso);
                }
                if (estatusValores.includes('pendiente')) {
                    actividadesFiltradas.push(...pendientes);
                }
            }

            setActividades(actividadesFiltradas);

            // Usar los conteos directos de la respuesta del servidor
            setResumenActividades({
                completadas: data.completadas?.total || 0,
                enCurso: data.en_curso?.total || 0,
                pendiente: data.pendiente?.total || 0
            });

        } catch (error) {
            console.error('Error al buscar actividades:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar las actividades'
            });
        } finally {
            setLoading(false);
        }
    };

    const verDetalleActividades = async (tipo: string) => {
        try {
            setLoading(true);
            
            // Construir filtros
            const filtros: any = {};
            
            if (fechaInicio) {
                filtros.fecha_inicio = fechaInicio.toISOString().split('T')[0];
            }
            
            if (fechaFin) {
                filtros.fecha_fin = fechaFin.toISOString().split('T')[0];
            }
            
            if (tiposProyectoSeleccionados.length > 0) {
                filtros.tipos_proyecto = tiposProyectoSeleccionados.map((t: any) => t.id);
            }

            const response = await ReporteService.getReporteActividades(filtros);
            const data = response.data || {};

            // Obtener actividades según el tipo seleccionado
            let actividadesFiltradas: any[] = [];
            
            switch (tipo) {
                case 'completado':
                    actividadesFiltradas = data.completadas?.actividades || [];
                    break;
                case 'en_curso':
                    actividadesFiltradas = data.en_curso?.actividades || [];
                    break;
                case 'pendiente':
                    actividadesFiltradas = data.pendiente?.actividades || [];
                    break;
            }

            setActividadesDetalle(actividadesFiltradas);
            setTipoDetalleSeleccionado(tipo);
            setShowDetalle(true);

        } catch (error) {
            console.error('Error al cargar detalles:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar los detalles'
            });
        } finally {
            setLoading(false);
        }
    };

    const limpiarFiltros = () => {
        setFechaInicio(null);
        setFechaFin(null);
        setTiposProyectoSeleccionados([]);
        setEstatusSeleccionado([]);
        setActividades([]);
        setResumenActividades({
            completadas: 0,
            enCurso: 0,
            pendiente: 0
        });
        setShowDetalle(false);
        setActividadesDetalle([]);
        setTipoDetalleSeleccionado('');
    };

    // Templates para la tabla de detalles
    const nombreTemplate = (rowData: any) => (
        <div>
            <div className="font-semibold">{rowData.nombre}</div>
            <div className="text-sm text-gray-600">{rowData.proyecto?.nombre || 'N/A'}</div>
            <div className="text-xs text-gray-500">{rowData.proyecto?.tipo_proyecto || 'N/A'}</div>
        </div>
    );

    const fechasTemplate = (rowData: any) => (
        <div>
            <div className="text-sm">
                <strong>Inicio:</strong> {rowData.fecha_inicio ? new Date(rowData.fecha_inicio).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}
            </div>
            <div className="text-sm">
                <strong>Fin:</strong> {rowData.fecha_fin ? new Date(rowData.fecha_fin).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}
            </div>
            {rowData.completed_at && (
                <div className="text-sm text-green-600">
                    <strong>Completada:</strong> {new Date(rowData.completed_at).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </div>
            )}
        </div>
    );

    const responsableTemplate = (rowData: any) => (
        <div>
            <div className="font-medium">{rowData.responsable?.nombre_completo || 'N/A'}</div>
        </div>
    );

    const estatusTemplate = (rowData: any) => {
        const estatus = determinarEstatusActividad(rowData);
        const vencida = isActividadVencida(rowData) && estatus !== 'completado';
        
        let severity = 'info';
        let label = 'Sin comenzar';
        
        switch (estatus) {
            case 'completado':
                severity = 'success';
                label = 'Completado';
                break;
            case 'en_curso':
                severity = vencida ? 'danger' : 'warning';
                label = vencida ? 'En curso (VENCIDA)' : 'En curso';
                break;
            case 'pendiente':
                severity = vencida ? 'danger' : 'info';
                label = vencida ? 'Sin comenzar (VENCIDA)' : 'Sin comenzar';
                break;
        }

        return (
            <div className="flex flex-column gap-1">
                <Tag value={label} severity={severity as any} />
               
                {rowData.porcentaje_avance_tareas !== undefined && (
                    <ProgressBar value={rowData.porcentaje_avance_tareas || 0} className="w-full text-sm" style={{ height: '12px' }} />
                )}
            </div>
        );
    };

    // Render de cards de resumen
    const renderCardResumen = (titulo: string, cantidad: number, tipo: string, color: string, icon: string) => (
        <div className="col-12 md:col-4">
            <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-3 border-left-3 border-${color}-500`}
                onClick={() => verDetalleActividades(tipo)}
            >
                <div className="flex align-items-center justify-content-between">
                    <div>
                        <div className="text-2xl font-bold mb-1">{cantidad}</div>
                        <div className={`text-${color}-600 font-semibold`}>{titulo}</div>
                    </div>
                    <div className={`text-${color}-500`}>
                        <i className={`${icon} text-4xl`}></i>
                    </div>
                </div>
            </Card>
        </div>
    );

    if (!hasPermission('reportes.actividades')) {
        return <AccessDenied />;
    }

    const renderToolbar = () => {
            return (
                <div className="mb-3 p-3 bg-white border-round-lg shadow-1 border-1 surface-border">
                    <div className="flex justify-content-between align-items-center mb-2">
                        <div className="flex gap-2 align-items-center">
                             <Button
                                icon={showFiltros ? "pi pi-eye-slash" : "pi pi-filter"}
                                label={showFiltros ? "Ocultar Filtros" : "Mostrar Filtros"}
                                onClick={() => setShowFiltros(!showFiltros)}
                                outlined
                            />
                        </div>
                    </div>
                    
                    {showFiltros && (
                        <div className="flex flex-column gap-3 p-3 border-round">
                            <div className="grid">
                                <div className="col-12 md:col-3">
                                    <label className="block text-sm font-medium mb-2">Fecha Inicio</label>
                                    <Calendar
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.value as Date)}
                                        placeholder="Seleccionar fecha"
                                        className="w-full"
                                        dateFormat="dd/mm/yy"
                                        showIcon
                                    />
                                </div>
                            
                                <div className="col-12 md:col-3">
                                    <label className="block text-sm font-medium mb-2">Fecha Fin</label>
                                    <Calendar
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.value as Date)}
                                        placeholder="Seleccionar fecha"
                                        className="w-full"
                                        dateFormat="dd/mm/yy"
                                        showIcon
                                    />
                                </div>
                            
                                <div className="col-12 md:col-3">
                                    <label className="block text-sm font-medium mb-2">Tipo de Proyecto</label>
                                    {loadingCatalogos ? (
                                        <Skeleton height="2.5rem" />
                                    ) : (
                                        <MultiSelect
                                            value={tiposProyectoSeleccionados}
                                            onChange={(e) => setTiposProyectoSeleccionados(e.value)}
                                            options={tiposProyecto}
                                            optionLabel="nombre"
                                            placeholder="Seleccionar tipos"
                                            className="w-full"
                                            display="chip"
                                        />
                                    )}
                                </div>
                            
                                <div className="col-12 md:col-3">
                                    <label className="block text-sm font-medium mb-2">Estatus</label>
                                    <MultiSelect
                                        value={estatusSeleccionado}
                                        onChange={(e) => setEstatusSeleccionado(e.value)}
                                        options={estatusOptions}
                                        optionLabel="label"
                                        placeholder="Seleccionar estatus"
                                        className="w-full"
                                        display="chip"
                                    />
                                </div>
                            </div>
                        
                            <div className="flex gap-2 mt-4">
                                <Button
                                    label="Buscar"
                                    icon="pi pi-search"
                                    onClick={buscarActividades}
                                    loading={loading}
                                />
                                <Button
                                    label="Limpiar"
                                    icon="pi pi-times"
                                    onClick={limpiarFiltros}
                                    outlined
                                />
                            </div>
                        </div>
                    )}
                </div>
            );
        };
    
    return (
        <PermissionGuard permission="reportes.actividades">
            <div className="surface-ground">
                <Toast ref={toast} />
                
                <div className="flex flex-column gap-4">
                    <CustomBreadcrumb 
                        items={breadcrumbItems}
                        theme="green"
                        title="Reporte de Actividades"
                        description="Análisis detallado de actividades con filtros y métricas de cumplimiento"
                    />

                    {/* Panel de Filtros - Collapsable */}
                    {renderToolbar()}

                    {/* Resumen de Actividades */}
                    {(resumenActividades.completadas > 0 || resumenActividades.enCurso > 0 || resumenActividades.pendiente > 0) && (
                        <div>
                            <h3 className="text-xl font-bold mb-3">Resumen</h3>
                            <div className="grid">
                                {renderCardResumen(
                                    'Completadas', 
                                    resumenActividades.completadas, 
                                    'completado', 
                                    'green', 
                                    'pi pi-check-circle'
                                )}
                                {renderCardResumen(
                                    'En Curso', 
                                    resumenActividades.enCurso, 
                                    'en_curso', 
                                    'orange', 
                                    'pi pi-clock'
                                )}
                                {renderCardResumen(
                                    'Sin Comenzar', 
                                    resumenActividades.pendiente, 
                                    'pendiente', 
                                    'blue', 
                                    'pi pi-circle'
                                )}
                            </div>
                        </div>
                    )}

                    {/* Estado de selección de grupo */}
                    {!showDetalle && actividades.length > 0 && (
                        <Card className="mt-4">
                            <div className="text-center p-5">
                                <i className="pi pi-info-circle text-6xl text-blue-400 mb-3"></i>
                                <h4 className="text-xl font-semibold mb-2">Selecciona un grupo para ver detalles</h4>
                                <p className="text-color-secondary m-0">
                                    Haz clic en cualquiera de las tarjetas de arriba para ver las actividades detalladas de ese grupo.
                                </p>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sección de Detalles - Se muestra en la parte inferior */}
                {showDetalle && (
                    <div className="mt-4">
                        <Card>
                            <div className="flex align-items-center justify-content-between mb-4">
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-list text-blue-500"></i>
                                    <h3 className="m-0">
                                        Actividades {
                                            tipoDetalleSeleccionado === 'completado' ? 'Completadas' :
                                            tipoDetalleSeleccionado === 'en_curso' ? 'En Curso' : 'Sin Comenzar'
                                        }
                                    </h3>
                                    <span className="text-sm text-gray-500">({actividadesDetalle.length} actividades)</span>
                                </div>
                                <Button
                                    icon="pi pi-times"
                                    rounded
                                    text
                                    size="small"
                                    onClick={() => setShowDetalle(false)}
                                    tooltip="Cerrar detalles"
                                    className="text-gray-600 hover:bg-gray-100"
                                />
                            </div>
                            
                            <DataTable
                                value={actividadesDetalle}
                                paginator
                                rows={10}
                                rowsPerPageOptions={[5, 10, 25]}
                                className="p-datatable-striped"
                                emptyMessage="No hay actividades que mostrar"
                                loading={loading}
                            >
                                <Column field="nombre" header="Actividad" body={nombreTemplate} sortable />
                                <Column header="Fechas" body={fechasTemplate} />
                                <Column header="Responsable" body={responsableTemplate} sortable />
                                <Column header="Estatus" body={estatusTemplate} />
                                <Column header="Avance de Tareas" body={(rowData) => (
                                    <div className="text-center">
                                        <div className="text-sm font-semibold">
                                            {rowData.tareas_completadas || 0}/{rowData.total_tareas || 0}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {Math.round(rowData.porcentaje_avance_tareas || 0)}%
                                        </div>
                                    </div>
                                )} />
                            </DataTable>
                        </Card>
                    </div>
                )}
            </div>
        </PermissionGuard>
    );
}
