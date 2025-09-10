'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Skeleton } from 'primereact/skeleton';
import * as XLSX from 'xlsx';

import { CustomBreadcrumb } from '@/src/components/CustomBreadcrumb';
import { PermissionGuard } from '@/src/components/PermissionGuard';
import { AccessDenied } from '@/src/components/AccessDenied';
import { usePermissions } from "@/src/hooks/usePermissions";
import { ReporteService } from '@/src/services/reportes';
import { TipoProyectoService, DepartamentoService } from '@/src/services/catalogos';

import { useNotification } from '@/layout/context/notificationContext';

export default function ReporteActividadesPage() {
    const router = useRouter();
    const { hasPermission } = usePermissions();
    const { showSuccess, showError, showInfo, showWarning } = useNotification();

    // Estados para filtros
    const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
    const [fechaFin, setFechaFin] = useState<Date | null>(null);
    const [tiposProyecto, setTiposProyecto] = useState([]);
    const [tipoProyectoSeleccionado, setTipoProyectoSeleccionado] = useState<any>(null);
    const [departamentos, setDepartamentos] = useState([]);
    const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<any>(null);
    const [estatusSeleccionado, setEstatusSeleccionado] = useState<any>(null);

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

    // Función para cargar catálogos con useCallback para evitar ciclos
    const cargarCatalogos = useCallback(async () => {
        try {
            setLoadingCatalogos(true);
            const [tiposResponse, departamentosResponse] = await Promise.all([
                TipoProyectoService.getListTipoProyecto(),
                DepartamentoService.getListDepartamento()
            ]);
            setTiposProyecto(tiposResponse.data || []);
            setDepartamentos(departamentosResponse.data || []);
        } catch (error) {
            showError('Error al cargar catálogos', 'No se pudieron cargar los catálogos. Por favor, recarga la página.');
        } finally {
            setLoadingCatalogos(false);
        }
    }, [showError]);

    // Efecto para cargar catálogos al montar el componente
    useEffect(() => {
        cargarCatalogos();
    }, [cargarCatalogos]);

    // Función para validar fechas
    const validarFechas = () => {
        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999); // Fin del día actual
        
        // Si solo una fecha está presente, mostrar advertencia pero permitir continuar
        if ((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin)) {
            showInfo('Filtro de fechas incompleto', 'Para aplicar filtro de rango de fechas, selecciona tanto fecha inicio como fecha fin.');
            return true; // Permitir continuar, solo no se enviarán las fechas
        }
        
        if (fechaInicio && fechaFin) {
            
            if (fechaInicio > fechaFin) {
                showError('Fechas inválidas', 'La fecha inicio no puede ser posterior a la fecha fin. Por favor, ajuste las fechas.');
                return false;
            }
        }
        return true;
    };

    // Función para resetear fechas inválidas
    const resetearFechasInvalidas = () => {
        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            setFechaInicio(null);
            setFechaFin(null);
            showInfo('Fechas reseteadas', 'Las fechas han sido limpiadas debido a una inconsistencia');
        }
    };

    const buscarActividades = useCallback(async () => {
        // Validar fechas antes de hacer la búsqueda
        if (!validarFechas()) {
            return;
        }

        setShowDetalle(false);
        setActividadesDetalle([]);
        try {
            setLoading(true);
            
            // Construir filtros
            const filtros: any = {};
            
            // Solo enviar fechas si ambas están presentes
            if (fechaInicio && fechaFin) {
                filtros.fecha_inicio = fechaInicio.toISOString().split('T')[0];
                filtros.fecha_fin = fechaFin.toISOString().split('T')[0];
            }
            
            if (tipoProyectoSeleccionado) {
                filtros.tipo_proyecto_id = tipoProyectoSeleccionado.id;
            }

            if (departamentoSeleccionado) {
                filtros.departamento_id = departamentoSeleccionado.id;
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
            if (estatusSeleccionado) {
                const estatusValor = estatusSeleccionado.value;
                
                if (estatusValor === 'completado') {
                    actividadesFiltradas = completadas;
                } else if (estatusValor === 'en_curso') {
                    actividadesFiltradas = enCurso;
                } else if (estatusValor === 'pendiente') {
                    actividadesFiltradas = pendientes;
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
            showError('Error al cargar actividades', 'Error al cargar las actividades. Por favor, inténtelo de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [fechaInicio, fechaFin, tipoProyectoSeleccionado, departamentoSeleccionado, estatusSeleccionado, showInfo, showError]);


    const verDetalleActividades = useCallback(async (tipo: string) => {
        // Validar fechas antes de mostrar detalles
        if (!validarFechas()) {
            return;
        }
        try {
            setLoading(true);
            
            // Construir filtros
            const filtros: any = {};
            
            // Solo enviar fechas si ambas están presentes
            if (fechaInicio && fechaFin) {
                filtros.fecha_inicio = fechaInicio.toISOString().split('T')[0];
                filtros.fecha_fin = fechaFin.toISOString().split('T')[0];
            }
            
            if (tipoProyectoSeleccionado) {
                filtros.tipo_proyecto_id = tipoProyectoSeleccionado.id;
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
            showError('Error al cargar detalles', 'No se pudieron cargar los detalles de las actividades. Por favor, inténtelo de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [fechaInicio, fechaFin, tipoProyectoSeleccionado, departamentoSeleccionado, showError]);

    const limpiarFiltros = useCallback(() => {
        setFechaInicio(null);
        setFechaFin(null);
        setTipoProyectoSeleccionado(null);
        setDepartamentoSeleccionado(null);
        setEstatusSeleccionado(null);
        setActividades([]);
        setResumenActividades({
            completadas: 0,
            enCurso: 0,
            pendiente: 0
        });
        setShowDetalle(false);
        setActividadesDetalle([]);
        setTipoDetalleSeleccionado('');
        showSuccess('Filtros limpiados', 'Todos los filtros han sido reseteados');
    }, [showSuccess]);

    // Función para exportar a Excel
    const exportarAExcel = useCallback(() => {
        if (actividadesDetalle.length === 0) {
            showWarning('Sin datos', 'No hay actividades para exportar. Selecciona un grupo primero.');
            return;
        }

        try {
            // Preparar datos para Excel
            const datosExcel = actividadesDetalle.map((actividad, index) => ({
                'N°': index + 1,
                'Actividad': actividad.nombre || 'N/A',
                'Proyecto': actividad.proyecto?.nombre || 'N/A',
                'Tipo de Proyecto': actividad.proyecto?.tipo_proyecto || 'N/A',
                'Departamento': actividad.proyecto?.departamento || 'N/A',
                'Responsable': actividad.responsable?.nombre_completo || 'N/A',
                'Fecha Inicio': actividad.fecha_inicio ? new Date(actividad.fecha_inicio).toLocaleDateString('es-ES') : 'N/A',
                'Fecha Fin': actividad.fecha_fin ? new Date(actividad.fecha_fin).toLocaleDateString('es-ES') : 'N/A',
                'Fecha Completada': actividad.completed_at ? new Date(actividad.completed_at).toLocaleDateString('es-ES') : 'N/A',
                'Total Tareas': actividad.total_tareas || 0,
                'Tareas Completadas': actividad.tareas_completadas || 0,
                'Porcentaje Avance': `${Math.round(actividad.porcentaje_avance_tareas || 0)}%`,
                'Estatus': determinarEstatusActividad(actividad) === 'completado' ? 'Completado' :
                          determinarEstatusActividad(actividad) === 'en_curso' ? 'En Curso' : 'Sin Comenzar'
            }));

            // Crear libro de Excel
            const wb = XLSX.utils.book_new();

            // Crear hoja de resumen
            const resumenData = [
                ['REPORTE DE ACTIVIDADES - FORMATO EJECUTIVO'],
                [''],
                ['RESUMEN GENERAL'],
                ['Completadas', resumenActividades.completadas],
                ['En Curso', resumenActividades.enCurso],
                ['Sin Comenzar', resumenActividades.pendiente],
                [''],
                ['DETALLE DE ACTIVIDADES - ' + (tipoDetalleSeleccionado === 'completado' ? 'COMPLETADAS' :
                                               tipoDetalleSeleccionado === 'en_curso' ? 'EN CURSO' : 'SIN COMENZAR')],
                ['']
            ];

            const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
            XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

            // Crear hoja de detalle
            const wsDetalle = XLSX.utils.json_to_sheet(datosExcel);
            XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle');

            // Configurar ancho de columnas
            const colWidths = [
                { wch: 5 },   // N°
                { wch: 40 },  // Actividad
                { wch: 30 },  // Proyecto
                { wch: 20 },  // Tipo Proyecto
                { wch: 25 },  // Responsable
                { wch: 12 },  // Fecha Inicio
                { wch: 12 },  // Fecha Fin
                { wch: 15 },  // Fecha Completada
                { wch: 12 },  // Total Tareas
                { wch: 15 },  // Tareas Completadas
                { wch: 15 },  // Porcentaje Avance
                { wch: 15 }   // Estatus
            ];
            wsDetalle['!cols'] = colWidths;

            // Generar nombre del archivo
            const fechaActual = new Date().toISOString().split('T')[0];
            const nombreArchivo = `Reporte_Actividades_${tipoDetalleSeleccionado}_${fechaActual}.xlsx`;

            // Descargar archivo
            XLSX.writeFile(wb, nombreArchivo);

            showSuccess('Exportación exitosa', `Archivo ${nombreArchivo} generado correctamente`);

        } catch (error) {
            showError('Error de exportación', 'Error al generar el archivo Excel');
        }
    }, [actividadesDetalle, resumenActividades, tipoDetalleSeleccionado, showWarning, showSuccess, showError]);

    // Templates para la tabla de detalles
    const nombreTemplate = (rowData: any) => (
        <div className='flex flex-column gap-1'>
            <div className="font-semibold">{rowData.nombre}</div>
            <div className="text-sm text-gray-600">{rowData.proyecto?.nombre || 'N/A'}</div>
            <div className="text-xs text-gray-500">{rowData.proyecto?.tipo_proyecto || 'N/A'}</div>
            <div className="text-xs text-gray-500">{rowData.proyecto?.departamento || 'N/A'}</div>
        </div>
    );

    const fechasTemplate = (rowData: any) => (
        <div className="flex flex-column gap-1">
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
                <div className="mb-3 p-2 bg-white border-round-lg shadow-1 border-1 surface-border">
                    <div className="flex justify-content-between align-items-center">
                        <div className="flex gap-2 align-items-center">
                             <Button
                                icon={showFiltros ? "pi pi-eye-slash" : "pi pi-filter"}
                                label={showFiltros ? "Ocultar Filtros" : "Mostrar Filtros"}
                                onClick={() => setShowFiltros(!showFiltros)}
                                outlined
                            />
                        </div>
                        <div className="flex align-items-center gap-2">
                                                    <Button
                                                        icon="pi pi-arrow-left"
                                                        label="Regresar a Centro de Reportes"
                                                        text
                                                        onClick={() => router.push('/reportes')}
                                                        className="text-primary-600 hover:bg-primary-50"
                                                        tooltip="Regresar al menú principal de centro de reportes"
                                                        tooltipOptions={{ position: 'bottom' }}
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
                                        onChange={(e) => {
                                            const nuevaFechaInicio = e.value as Date;
                                            setFechaInicio(nuevaFechaInicio);
                                            
                                            // Si hay fecha fin y la nueva fecha inicio es posterior, ajustar
                                            if (fechaFin && nuevaFechaInicio && nuevaFechaInicio > fechaFin) {
                                                setFechaFin(null);
                                                showWarning('Fecha fin ajustada', 'La fecha fin ha sido limpiada porque era anterior a la nueva fecha inicio');
                                            }
                                        }}
                                        placeholder="Seleccionar fecha"
                                        className="w-full"
                                        dateFormat="dd/mm/yy"
                                        showIcon
                                        maxDate={fechaFin || undefined}
                                      
                                    />
                                </div>
                            
                                <div className="col-12 md:col-3">
                                    <label className="block text-sm font-medium mb-2">Fecha Fin</label>
                                    <Calendar
                                        value={fechaFin}
                                        onChange={(e) => {
                                            const nuevaFechaFin = e.value as Date;
                                            setFechaFin(nuevaFechaFin);
                                            
                                            // Si hay fecha inicio y la nueva fecha fin es anterior, ajustar
                                            if (fechaInicio && nuevaFechaFin && nuevaFechaFin < fechaInicio) {
                                                setFechaInicio(null);
                                                showWarning('Fecha inicio ajustada', 'La fecha inicio ha sido limpiada porque era posterior a la nueva fecha fin');
                                            }
                                        }}
                                        placeholder="Seleccionar fecha"
                                        className="w-full"
                                        dateFormat="dd/mm/yy"
                                        showIcon
                                        minDate={fechaInicio || undefined}
                                    />
                                </div>
                            
                                <div className="col-12 md:col-3">
                                    <label className="block text-sm font-medium mb-2">Tipo de Proyecto</label>
                                    {loadingCatalogos ? (
                                        <Skeleton height="2.5rem" />
                                    ) : (
                                        <Dropdown
                                            filter
                                            value={tipoProyectoSeleccionado}
                                            onChange={(e) => setTipoProyectoSeleccionado(e.value)}
                                            options={tiposProyecto}
                                            optionLabel="nombre"
                                            placeholder="Seleccionar tipo"
                                            className="w-full"
                                            showClear
                                        />
                                    )}
                                </div>

                                <div className="col-12 md:col-3">
                                    <label className="block text-sm font-medium mb-2">Departamento</label>
                                    {loadingCatalogos ? (
                                        <Skeleton height="2.5rem" />
                                    ) : (
                                        <Dropdown
                                            filter
                                            value={departamentoSeleccionado}
                                            onChange={(e) => setDepartamentoSeleccionado(e.value)}
                                            options={departamentos}
                                            optionLabel="nombre"
                                            placeholder="Seleccionar departamento"
                                            className="w-full"
                                            showClear
                                        />
                                    )}
                                </div>
                            
                                <div className="col-12 md:col-3">
                                    <label className="block text-sm font-medium mb-2">Estatus</label>
                                    <Dropdown
                                        filter
                                        value={estatusSeleccionado}
                                        onChange={(e) => setEstatusSeleccionado(e.value)}
                                        options={estatusOptions}
                                        optionLabel="label"
                                        placeholder="Seleccionar estatus"
                                        className="w-full"
                                        showClear
                                    />
                                </div>
                            </div>
                        
                            <div className="flex gap-2 mt-4">
                                <Button
                                    label="Buscar"
                                    icon="pi pi-search"
                                    onClick={buscarActividades}
                                    loading={loading}
                                    disabled={loading}
                                />
                                <Button
                                    label="Limpiar"
                                    icon="pi pi-times"
                                    onClick={limpiarFiltros}
                                    outlined
                                    disabled={loading}
                                />
                                {(fechaInicio || fechaFin || tipoProyectoSeleccionado || departamentoSeleccionado || estatusSeleccionado) && (
                                    <div className="flex align-items-center ml-2">
                                        <small className="text-color-secondary">
                                            {tipoProyectoSeleccionado && `Tipo: ${tipoProyectoSeleccionado.nombre} • `}
                                            {departamentoSeleccionado && `Depto: ${departamentoSeleccionado.nombre} • `}
                                            {estatusSeleccionado && `Estatus: ${estatusSeleccionado.label} • `}
                                            {(fechaInicio && fechaFin) && 'Rango de fechas configurado • '}
                                            {((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin)) && 'Completa ambas fechas para aplicar filtro de rango'}
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        };
    
    return (
        <PermissionGuard permission="reportes.actividades">
            <div className="surface-ground">     
                <div className="flex flex-column gap-4">
                    <CustomBreadcrumb
                            items={breadcrumbItems}
                            theme="green"
                            title="Reporte de Actividades"
                            description="Análisis detallado de actividades con filtros y métricas de cumplimiento"
                        />

                    {/* Indicadores de estado y validación */}
                    <div className="flex justify-content-between align-items-center">
                        <div className="flex align-items-center gap-2">
                            {(fechaInicio || fechaFin || tipoProyectoSeleccionado || departamentoSeleccionado || estatusSeleccionado) && !loading && (
                                <div className="flex align-items-center gap-1 text-primary-600 bg-primary-50 p-2 border-round">
                                    <i className="pi pi-filter"></i>
                                    <small className="font-medium">Filtros configurados - Haz clic en &quot;Buscar&quot; para aplicar</small>
                                </div>
                            )}
                        </div>
                    </div>

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
                                    'gray', 
                                    'pi pi-circle'
                                )}
                            </div>
                        </div>
                    )}

                    {/* Estado de carga inicial */}
                    {loading && actividades.length === 0 && (
                        <Card className="mt-4">
                            <div className="text-center p-5">
                                <ProgressBar mode="indeterminate" style={{ height: '6px' }} className="mb-3" />
                                <h4 className="text-xl font-semibold mb-2">Cargando actividades...</h4>
                                <p className="text-color-secondary m-0">
                                    Estamos procesando tu solicitud. Esto puede tomar unos momentos.
                                </p>
                            </div>
                        </Card>
                    )}

                    {/* Sin resultados - Con filtros aplicados */}
                    {actividades.length === 0 && !loading && (fechaInicio || fechaFin || tipoProyectoSeleccionado || departamentoSeleccionado || estatusSeleccionado) && (
                        <Card className="mt-4">
                            <div className="text-center p-5">
                                <i className="pi pi-search text-6xl text-orange-500 mb-3"></i>
                                <h4 className="text-xl font-semibold mb-2">Sin resultados</h4>
                                <p className="text-color-secondary mb-3">
                                    No se encontraron actividades que coincidan con los filtros aplicados.
                                </p>
                                <Button 
                                    label="Limpiar filtros" 
                                    severity="secondary" 
                                    outlined 
                                    size="small"
                                    onClick={limpiarFiltros}
                                    icon="pi pi-filter-slash"
                                />
                            </div>
                        </Card>
                    )}

                    {/* Estado inicial - Sin filtros aplicados */}
                    {actividades.length === 0 && !loading && !(fechaInicio || fechaFin || tipoProyectoSeleccionado || departamentoSeleccionado || estatusSeleccionado) && (
                        <Card className="mt-4">
                            <div className="text-center p-5">
                                <i className="pi pi-chart-line text-6xl text-primary-600 mb-3"></i>
                                <h4 className="text-xl font-semibold mb-2">Bienvenido al Reporte de Actividades</h4>
                                <p className="text-color-secondary m-0">
                                    Aplica filtros para ver el análisis detallado de actividades y métricas de cumplimiento.
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
                                    <i className="pi pi-list text-primary-500"></i>
                                    <h5 className="m-0">
                                        Actividades {
                                            tipoDetalleSeleccionado === 'completado' ? 'Completadas' :
                                            tipoDetalleSeleccionado === 'en_curso' ? 'En Curso' : 'Sin Comenzar'
                                        }
                                    </h5>
                                    <span className="text-sm text-gray-500">({actividadesDetalle.length} actividades)</span>
                                </div>
                                <div className="flex align-items-center gap-2">
                                    <Button
                                        icon="pi pi-file-excel"
                                        label="Exportar Excel"
                                        onClick={exportarAExcel}
                                        className="p-button-success p-button-sm"
                                        tooltip="Exportar a Excel en formato ejecutivo"
                                        tooltipOptions={{ position: 'bottom' }}
                                    />
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
