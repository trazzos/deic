'use client';
import React, { useState, useEffect, useRef } from 'react';
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
    ProyectoService, 
    TipoProyectoService,
    DepartamentoService 
} from '@/src/services';

interface ReporteProyecto {
    uuid: string;
    nombre: string;
    descripcion: string;
    tipo_proyecto: string;
    departamento: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    porcentaje_avance: number;
    total_actividades: number;
    actividades_completadas: number;
    proyectado: number;
    alcanzado: number;
    beneficiados: number;
    estatus: 'Activo' | 'Completado' | 'En Pausa' | 'Cancelado';
    responsable: string;
    actividades: ActividadReporte[];
}

interface ActividadReporte {
    uuid: string;
    nombre: string;
    tipo_actividad: string;
    capacitador: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    porcentaje_avance: number;
    beneficiados: number;
    proyectado: number;
    alcanzado: number;
}

interface FiltrosReporte {
    fechaInicio: Date | null;
    fechaFin: Date | null;
    tipoProyecto: any;
    departamento: any;
    estatus: any;
    nombreProyecto: string;
}

export default function ReportesPage() {
    const [reporteData, setReporteData] = useState<ReporteProyecto[]>([]);
    const [loading, setLoading] = useState(false);
    const [tiposProyecto, setTiposProyecto] = useState<any[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [filtros, setFiltros] = useState<FiltrosReporte>({
        fechaInicio: null,
        fechaFin: null,
        tipoProyecto: null,
        departamento: null,
        estatus: null,
        nombreProyecto: ''
    });

    const toast = useRef<Toast>(null);
    const { hasPermission } = usePermissions();
    const { showSuccess, showError } = useNotification();

    const estatusOptions = [
        { label: 'Todos', value: null },
        { label: 'Activo', value: 'Activo' },
        { label: 'Completado', value: 'Completado' },
        { label: 'En Pausa', value: 'En Pausa' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    const breadcrumbItems = [
        { label: 'Reportes', url: '/reportes/index' },
        { label: 'Proyectos' }
    ];

    useEffect(() => {
        cargarCatalogos();
        cargarReporteProyectos();
    }, []);

    const cargarCatalogos = async () => {
        try {
            const [tiposResponse, deptosResponse] = await Promise.all([
                TipoProyectoService.getListTipoProyecto(),
                DepartamentoService.getListDepartamento()
            ]);

            setTiposProyecto([
                { label: 'Todos', value: null },
                ...tiposResponse.data.map((tipo: any) => ({
                    label: tipo.nombre,
                    value: tipo.id
                }))
            ]);

            setDepartamentos([
                { label: 'Todos', value: null },
                ...deptosResponse.data.map((depto: any) => ({
                    label: depto.nombre,
                    value: depto.id
                }))
            ]);
        } catch (error) {
            console.error('Error cargando catálogos:', error);
        }
    };

    const cargarReporteProyectos = async () => {
        setLoading(true);
        try {
            // Simulando datos para el reporte
            // En producción, esta llamada debería incluir los filtros
            const response = await ProyectoService.getListProyecto();
            
            // Transformando los datos para el reporte
            const proyectosConReporte = response.data.map((proyecto: any) => ({
                uuid: proyecto.uuid,
                nombre: proyecto.nombre,
                descripcion: proyecto.descripcion,
                tipo_proyecto: proyecto.tipo_proyecto?.nombre || 'No definido',
                departamento: proyecto.departamento?.nombre || 'No definido',
                fecha_inicio: new Date(proyecto.fecha_inicio || Date.now()),
                fecha_fin: new Date(proyecto.fecha_fin || Date.now()),
                porcentaje_avance: proyecto.porcentaje_avance || Math.floor(Math.random() * 100),
                total_actividades: Math.floor(Math.random() * 15) + 5,
                actividades_completadas: Math.floor(Math.random() * 10) + 1,
                proyectado: Math.floor(Math.random() * 500) + 100,
                alcanzado: Math.floor(Math.random() * 400) + 50,
                beneficiados: Math.floor(Math.random() * 200) + 20,
                estatus: ['Activo', 'Completado', 'En Pausa'][Math.floor(Math.random() * 3)] as any,
                responsable: 'Usuario Demo',
                actividades: []
            }));

            setReporteData(proyectosConReporte);
        } catch (error) {
            console.error('Error cargando reporte:', error);
            showError('Error al cargar el reporte de proyectos');
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        cargarReporteProyectos();
    };

    const limpiarFiltros = () => {
        setFiltros({
            fechaInicio: null,
            fechaFin: null,
            tipoProyecto: null,
            departamento: null,
            estatus: null,
            nombreProyecto: ''
        });
        cargarReporteProyectos();
    };

    const exportarExcel = () => {
        try {
            const workbook = XLSX.utils.book_new();
            
            // Hoja principal con datos del proyecto
            const wsData = reporteData.map(proyecto => ({
                'Proyecto': proyecto.nombre,
                'Tipo': proyecto.tipo_proyecto,
                'Departamento': proyecto.departamento,
                'Fecha Inicio': proyecto.fecha_inicio.toLocaleDateString(),
                'Fecha Fin': proyecto.fecha_fin.toLocaleDateString(),
                'Progreso (%)': proyecto.porcentaje_avance,
                'Actividades Total': proyecto.total_actividades,
                'Actividades Completadas': proyecto.actividades_completadas,
                'Proyectado': proyecto.proyectado,
                'Alcanzado': proyecto.alcanzado,
                'Beneficiados': proyecto.beneficiados,
                'Estatus': proyecto.estatus,
                'Responsable': proyecto.responsable
            }));

            const ws = XLSX.utils.json_to_sheet(wsData);
            XLSX.utils.book_append_sheet(workbook, ws, 'Reporte Proyectos');

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
    };

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

    return (
        <div className="surface-ground px-4 py-8 md:px-6 lg:px-8">
            <Toast ref={toast} />
            
            <div className="flex flex-column gap-4">
                <CustomBreadcrumb 
                    items={breadcrumbItems}
                    theme="blue"
                    title="Reporte de Proyectos"
                    description="Análisis detallado del progreso y resultados de proyectos"
                />

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

                {/* Resumen General */}
                {!loading && reporteData.length > 0 && (
                    <Panel header="Resumen General" className="mb-4">
                        {resumenGeneral()}
                    </Panel>
                )}

                {/* Filtros */}
                <Panel header="Filtros de Búsqueda" toggleable collapsed>
                    <div className="grid formgrid p-fluid">
                        <div className="field col-12 md:col-3">
                            <label htmlFor="fechaInicio">Fecha Inicio</label>
                            <Calendar
                                id="fechaInicio"
                                value={filtros.fechaInicio}
                                onChange={(e) => setFiltros({...filtros, fechaInicio: e.value || null})}
                                showIcon
                                dateFormat="dd/mm/yy"
                                placeholder="Seleccionar fecha"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label htmlFor="fechaFin">Fecha Fin</label>
                            <Calendar
                                id="fechaFin"
                                value={filtros.fechaFin}
                                onChange={(e) => setFiltros({...filtros, fechaFin: e.value || null})}
                                showIcon
                                dateFormat="dd/mm/yy"
                                placeholder="Seleccionar fecha"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label htmlFor="tipoProyecto">Tipo de Proyecto</label>
                            <Dropdown
                                id="tipoProyecto"
                                value={filtros.tipoProyecto}
                                options={tiposProyecto}
                                onChange={(e) => setFiltros({...filtros, tipoProyecto: e.value})}
                                placeholder="Seleccionar tipo"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label htmlFor="departamento">Departamento</label>
                            <Dropdown
                                id="departamento"
                                value={filtros.departamento}
                                options={departamentos}
                                onChange={(e) => setFiltros({...filtros, departamento: e.value})}
                                placeholder="Seleccionar departamento"
                            />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label htmlFor="estatus">Estatus</label>
                            <Dropdown
                                id="estatus"
                                value={filtros.estatus}
                                options={estatusOptions}
                                onChange={(e) => setFiltros({...filtros, estatus: e.value})}
                                placeholder="Seleccionar estatus"
                            />
                        </div>
                        <div className="field col-12 md:col-5">
                            <label htmlFor="nombreProyecto">Nombre del Proyecto</label>
                            <InputText
                                id="nombreProyecto"
                                value={filtros.nombreProyecto}
                                onChange={(e) => setFiltros({...filtros, nombreProyecto: e.target.value})}
                                placeholder="Buscar por nombre..."
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
                <Card>
                    <DataTable
                        value={reporteData}
                        loading={loading}
                        responsiveLayout="scroll"
                        scrollable
                        scrollHeight="60vh"
                        stripedRows
                        size="small"
                        emptyMessage="No se encontraron proyectos"
                        globalFilter={filtros.nombreProyecto}
                        header={
                            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
                                <h3 className="m-0">Proyectos ({reporteData.length})</h3>
                                <span className="text-color-secondary">
                                    {loading ? 'Cargando...' : `Mostrando ${reporteData.length} proyectos`}
                                </span>
                            </div>
                        }
                    >
                        <Column 
                            field="nombre" 
                            header="Proyecto" 
                            style={{ minWidth: '200px' }}
                            body={(rowData) => (
                                <div>
                                    <div className="font-semibold">{rowData.nombre}</div>
                                    <div className="text-sm text-color-secondary">{rowData.tipo_proyecto}</div>
                                </div>
                            )}
                        />
                        <Column 
                            field="departamento" 
                            header="Departamento" 
                            style={{ minWidth: '150px' }}
                        />
                        <Column 
                            header="Progreso" 
                            body={renderProgreso}
                            style={{ minWidth: '150px' }}
                        />
                        <Column 
                            header="Actividades" 
                            body={renderActividades}
                            style={{ minWidth: '120px' }}
                        />
                        <Column 
                            header="Indicadores" 
                            body={renderIndicadores}
                            style={{ minWidth: '180px' }}
                        />
                        <Column 
                            field="beneficiados" 
                            header="Beneficiados"
                            body={(rowData) => rowData.beneficiados.toLocaleString()}
                            style={{ minWidth: '120px' }}
                        />
                        <Column 
                            header="Estatus" 
                            body={renderEstatus}
                            style={{ minWidth: '120px' }}
                        />
                        <Column 
                            field="responsable" 
                            header="Responsable" 
                            style={{ minWidth: '150px' }}
                        />
                    </DataTable>
                </Card>
            </div>
        </div>
    );
}
