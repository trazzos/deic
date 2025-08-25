'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { Divider } from 'primereact/divider';
import { TabView, TabPanel } from 'primereact/tabview';
import { Card } from 'primereact/card';
import * as Yup from 'yup';

import { CustomBreadcrumb } from '@/src/components/CustomBreadcrumb';
import { usePermissions } from '@/src/hooks/usePermissions';
import { useNotification } from '@/layout/context/notificationContext';
import { mockOrganizacionService } from '@/src/services/organizacion';
// import OrganizacionService from '@/src/services/organizacion'; // Use this for API integration

// Using mock service for development - replace with OrganizacionService for production
const OrganizacionService = mockOrganizacionService;

// Interfaces
interface Secretaria {
    id?: number;
    nombre: string;
    descripcion: string;
}

interface Subsecretaria {
    id?: number;
    nombre: string;
    descripcion: string;
    secretaria_id: number;
    secretaria?: { nombre: string };
}

interface Direccion {
    id?: number;
    nombre: string;
    descripcion: string;
    subsecretaria_id: number;
    subsecretaria?: { nombre: string };
}

// Validation schemas
const secretariaSchema = Yup.object().shape({
    nombre: Yup.string().required('El nombre es obligatorio'),
    descripcion: Yup.string().required('La descripción es obligatoria')
});

const subsecretariaSchema = Yup.object().shape({
    nombre: Yup.string().required('El nombre es obligatorio'),
    descripcion: Yup.string().required('La descripción es obligatoria'),
    secretaria_id: Yup.number().required('La secretaría es obligatoria')
});

const direccionSchema = Yup.object().shape({
    nombre: Yup.string().required('El nombre es obligatorio'),
    descripcion: Yup.string().required('La descripción es obligatoria'),
    subsecretaria_id: Yup.number().required('La subsecretaría es obligatoria')
});

export default function OrganizacionPage() {
    // Access
    const { isSuperAdmin, canUpdate, canDelete, canCreate } = usePermissions();
    const accessCreateSecretaria = isSuperAdmin || canCreate('catalogos.organizacion.secretarias.agregar');
    const accessEditSecretaria = isSuperAdmin || canUpdate('catalogos.organizacion.secretarias.editar');
    const accessDeleteSecretaria = isSuperAdmin || canDelete('catalogos.organizacion.secretarias.eliminar');
    // Filters
    const [filtersSecretaria, setFiltersSecretaria] = useState<DataTableFilterMeta>({});
    const [globalFilterValueSecretaria, setGlobalFilterValueSecretaria] = useState('');

    // States
    const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
    const [subsecretarias, setSubsecretarias] = useState<Subsecretaria[]>([]);
    const [direcciones, setDirecciones] = useState<Direccion[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    // Dialog states
    const [secretariaDialog, setSecretariaDialog] = useState(false);
    const [subsecretariaDialog, setSubsecretariaDialog] = useState(false);
    const [direccionDialog, setDireccionDialog] = useState(false);

    // Form states
    const [secretariaForm, setSecretariaForm] = useState<Secretaria>({ nombre: '', descripcion: '' });
    const [subsecretariaForm, setSubsecretariaForm] = useState<Subsecretaria>({ nombre: '', descripcion: '', secretaria_id: 0 });
    const [direccionForm, setDireccionForm] = useState<Direccion>({ nombre: '', descripcion: '', subsecretaria_id: 0 });

    // Error states
    const [secretariaErrors, setSecretariaErrors] = useState<any>({});
    const [subsecretariaErrors, setSubsecretariaErrors] = useState<any>({});
    const [direccionErrors, setDireccionErrors] = useState<any>({});

    const [isEditing, setIsEditing] = useState(false);

    const toast = useRef<Toast>(null);
    const { hasPermission } = usePermissions();
    const { showSuccess, showError } = useNotification();

    const breadcrumbItems = [
        { label: 'Catálogos', url: '/catalogos' },
        { label: 'Organización' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!hasPermission('catalogos.organizacion')) return;
        
        setLoading(true);
        try {
            const [secretariasRes, subsecretariasRes, direccionesRes] = await Promise.all([
                OrganizacionService.getSecretarias(),
                OrganizacionService.getSubsecretarias(),
                OrganizacionService.getDirecciones()
            ]);

            setSecretarias(secretariasRes.data);
            setSubsecretarias(subsecretariasRes.data);
            setDirecciones(direccionesRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
            showError('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

     

    // SECRETARÍAS CRUD
    const openNewSecretaria = () => {
        setSecretariaForm({ nombre: '', descripcion: '' });
        setSecretariaErrors({});
        setIsEditing(false);
        setSecretariaDialog(true);
    };

    const editSecretaria = (secretaria: Secretaria) => {
        setSecretariaForm({ ...secretaria });
        setSecretariaErrors({});
        setIsEditing(true);
        setSecretariaDialog(true);
    };

    const saveSecretaria = async () => {
        try {
            await secretariaSchema.validate(secretariaForm, { abortEarly: false });
            setSecretariaErrors({});

            if (isEditing && secretariaForm.id) {
                const response = await OrganizacionService.updateSecretaria(secretariaForm.id, secretariaForm);
                setSecretarias(prev => prev.map(item => item.id === secretariaForm.id ? response.data : item));
                showSuccess('Secretaría actualizada correctamente');
            } else {
                const response = await OrganizacionService.createSecretaria(secretariaForm);
                setSecretarias(prev => [...prev, response.data]);
                showSuccess('Secretaría creada correctamente');
            }

            setSecretariaDialog(false);
        } catch (error: any) {
            if (error.inner) {
                const errors: any = {};
                error.inner.forEach((err: any) => {
                    if (err.path) errors[err.path] = err.message;
                });
                setSecretariaErrors(errors);
            } else {
                showError('Error al guardar la secretaría');
            }
        }
    };

    const deleteSecretaria = (secretaria: Secretaria) => {
        confirmDialog({
            message: `¿Está seguro de eliminar la secretaría "${secretaria.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                try {
                    await OrganizacionService.deleteSecretaria(secretaria.id!);
                    setSecretarias(prev => prev.filter(item => item.id !== secretaria.id));
                    showSuccess('Secretaría eliminada correctamente');
                } catch (error) {
                    showError('Error al eliminar la secretaría');
                }
            }
        });
    };

    // SUBSECRETARÍAS CRUD
    const openNewSubsecretaria = () => {
        setSubsecretariaForm({ nombre: '', descripcion: '', secretaria_id: 0 });
        setSubsecretariaErrors({});
        setIsEditing(false);
        setSubsecretariaDialog(true);
    };

    const editSubsecretaria = (subsecretaria: Subsecretaria) => {
        setSubsecretariaForm({ ...subsecretaria });
        setSubsecretariaErrors({});
        setIsEditing(true);
        setSubsecretariaDialog(true);
    };

    const saveSubsecretaria = async () => {
        try {
            await subsecretariaSchema.validate(subsecretariaForm, { abortEarly: false });
            setSubsecretariaErrors({});

            if (isEditing && subsecretariaForm.id) {
                const response = await OrganizacionService.updateSubsecretaria(subsecretariaForm.id, subsecretariaForm);
                setSubsecretarias(prev => prev.map(item => item.id === subsecretariaForm.id ? response.data : item));
                showSuccess('Subsecretaría actualizada correctamente');
            } else {
                const response = await OrganizacionService.createSubsecretaria(subsecretariaForm);
                setSubsecretarias(prev => [...prev, response.data]);
                showSuccess('Subsecretaría creada correctamente');
            }

            setSubsecretariaDialog(false);
        } catch (error: any) {
            if (error.inner) {
                const errors: any = {};
                error.inner.forEach((err: any) => {
                    if (err.path) errors[err.path] = err.message;
                });
                setSubsecretariaErrors(errors);
            } else {
                showError('Error al guardar la subsecretaría');
            }
        }
    };

    const deleteSubsecretaria = (subsecretaria: Subsecretaria) => {
        confirmDialog({
            message: `¿Está seguro de eliminar la subsecretaría "${subsecretaria.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                try {
                    await OrganizacionService.deleteSubsecretaria(subsecretaria.id!);
                    setSubsecretarias(prev => prev.filter(item => item.id !== subsecretaria.id));
                    showSuccess('Subsecretaría eliminada correctamente');
                } catch (error) {
                    showError('Error al eliminar la subsecretaría');
                }
            }
        });
    };

    // DIRECCIONES CRUD
    const openNewDireccion = () => {
        setDireccionForm({ nombre: '', descripcion: '', subsecretaria_id: 0 });
        setDireccionErrors({});
        setIsEditing(false);
        setDireccionDialog(true);
    };

    const editDireccion = (direccion: Direccion) => {
        setDireccionForm({ ...direccion });
        setDireccionErrors({});
        setIsEditing(true);
        setDireccionDialog(true);
    };

    const saveDireccion = async () => {
        try {
            await direccionSchema.validate(direccionForm, { abortEarly: false });
            setDireccionErrors({});

            if (isEditing && direccionForm.id) {
                const response = await OrganizacionService.updateDireccion(direccionForm.id, direccionForm);
                setDirecciones(prev => prev.map(item => item.id === direccionForm.id ? response.data : item));
                showSuccess('Dirección actualizada correctamente');
            } else {
                const response = await OrganizacionService.createDireccion(direccionForm);
                setDirecciones(prev => [...prev, response.data]);
                showSuccess('Dirección creada correctamente');
            }

            setDireccionDialog(false);
        } catch (error: any) {
            if (error.inner) {
                const errors: any = {};
                error.inner.forEach((err: any) => {
                    if (err.path) errors[err.path] = err.message;
                });
                setDireccionErrors(errors);
            } else {
                showError('Error al guardar la dirección');
            }
        }
    };

    const deleteDireccion = (direccion: Direccion) => {
        confirmDialog({
            message: `¿Está seguro de eliminar la dirección "${direccion.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                try {
                    await OrganizacionService.deleteDireccion(direccion.id!);
                    setDirecciones(prev => prev.filter(item => item.id !== direccion.id));
                    showSuccess('Dirección eliminada correctamente');
                } catch (error) {
                    showError('Error al eliminar la dirección');
                }
            }
        });
    };

    const headerSecretaria = (
                <div className="flex flex-column md:flex-row justify-content-between gap-1">
                        <div className="flex flex-auto gap-2 ">
                            <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined />
                        <span className="p-input-icon-left">
                            <i className="pi pi-search" />
                            <InputText placeholder="Busqueda por palabras" />
                        </span>
                        </div>
                        <div className="flex flex-grow-1 justify-content-start md:justify-content-end">
                            { accessCreateSecretaria && (
                                <Button
                                    className="w-auto"
                                    type="button"
                                    icon="pi pi-plus"
                                    label="Agregar"
                                    onClick={openNewSecretaria}
                                />
                            )}
                        </div>
                </div>
    );

    // Action body templates
    const actionBodyTemplate = (rowData: any, type: 'secretaria' | 'subsecretaria' | 'direccion') => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    rounded
                    outlined
                    severity="info"
                    size="small"
                    onClick={() => {
                        if (type === 'secretaria') editSecretaria(rowData);
                        else if (type === 'subsecretaria') editSubsecretaria(rowData);
                        else editDireccion(rowData);
                    }}
                    disabled={!hasPermission(`catalogos.organizacion.${type}.editar`)}
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    outlined
                    severity="danger"
                    size="small"
                    onClick={() => {
                        if (type === 'secretaria') deleteSecretaria(rowData);
                        else if (type === 'subsecretaria') deleteSubsecretaria(rowData);
                        else deleteDireccion(rowData);
                    }}
                    disabled={!hasPermission(`catalogos.organizacion.${type}.eliminar`)}
                />
            </div>
        );
    };

    if (!hasPermission('catalogos.organizacion')) {
        return (
            <div className="surface-ground px-4 py-8 md:px-6 lg:px-8">
                <div className="text-center">
                    <i className="pi pi-lock text-6xl text-color-secondary mb-3"></i>
                    <h3>Acceso Denegado</h3>
                    <p className="text-color-secondary">No tienes permisos para acceder a este catálogo.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="surface-ground ">
            <Toast ref={toast} />
            
            <div className="flex flex-column gap-4">
                <CustomBreadcrumb 
                    items={breadcrumbItems}
                    theme="green"
                    title="Organización"
                    description="Gestión de la estructura organizacional"
                />
                <div className='border overflow-hidden border-gray-200 border-round-2xl'>
                    <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                        {/* SECRETARÍAS TAB */}
                        <TabPanel header="Secretarías" leftIcon="pi pi-building mr-2">
                            <div className="flex flex-column gap-4">
                               
                                <div className='border border-1 border-gray-100 overflow-hidden border-round-xl'>
                                    <DataTable 
                                        value={secretarias} 
                                        loading={loading}
                                        paginator 
                                        rows={10}
                                        rowsPerPageOptions={[5, 10, 25]}
                                        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                                        globalFilterFields={['nombre', 'descripcion']}
                                        emptyMessage="No se encontraron registros"
                                        responsiveLayout="scroll"
                                        header={headerSecretaria}
                                    >
                                    <Column field="nombre" header="Nombre" sortable style={{ minWidth: '200px' }} />
                                    <Column field="descripcion" header="Descripción" sortable />
                                    <Column 
                                        body={(rowData) => actionBodyTemplate(rowData, 'secretaria')} 
                                        exportable={false} 
                                        style={{ minWidth: '120px', textAlign: 'center' }} 
                                    />
                                </DataTable>
                                </div>
                                
                            </div>
                        </TabPanel>

                        {/* SUBSECRETARÍAS TAB */}
                        <TabPanel header="Subsecretarías" leftIcon="pi pi-sitemap">
                            <div className="flex flex-column gap-4">
                                <Toolbar 
                                    start={
                                        <div className="flex align-items-center gap-2">
                                            <i className="pi pi-sitemap text-xl"></i>
                                            <h4 className="m-0">Subsecretarías</h4>
                                        </div>
                                    }
                                    end={
                                        <Button 
                                            label="Nueva Subsecretaría" 
                                            icon="pi pi-plus" 
                                            onClick={openNewSubsecretaria}
                                            disabled={!hasPermission('catalogos.organizacion.subsecretaria.crear')}
                                        />
                                    } 
                                />

                                <DataTable 
                                    value={subsecretarias} 
                                    loading={loading}
                                    paginator 
                                    rows={10}
                                    rowsPerPageOptions={[5, 10, 25]}
                                    paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} subsecretarías"
                                    globalFilterFields={['nombre', 'descripcion', 'secretaria.nombre']}
                                    emptyMessage="No se encontraron subsecretarías"
                                    responsiveLayout="scroll"
                                >
                                    <Column field="nombre" header="Nombre" sortable style={{ minWidth: '200px' }} />
                                    <Column field="descripcion" header="Descripción" sortable />
                                    <Column 
                                        field="secretaria.nombre" 
                                        header="Secretaría" 
                                        sortable 
                                        style={{ minWidth: '200px' }} 
                                    />
                                    <Column 
                                        body={(rowData) => actionBodyTemplate(rowData, 'subsecretaria')} 
                                        exportable={false} 
                                        style={{ minWidth: '120px', textAlign: 'center' }} 
                                    />
                                </DataTable>
                            </div>
                        </TabPanel>

                        {/* DIRECCIONES TAB */}
                        <TabPanel header="Direcciones" leftIcon="pi pi-users">
                            <div className="flex flex-column gap-4">
                                <Toolbar 
                                    start={
                                        <div className="flex align-items-center gap-2">
                                            <i className="pi pi-users text-xl"></i>
                                            <h4 className="m-0">Direcciones</h4>
                                        </div>
                                    }
                                    end={
                                        <Button 
                                            label="Nueva Dirección" 
                                            icon="pi pi-plus" 
                                            onClick={openNewDireccion}
                                            disabled={!hasPermission('catalogos.organizacion.direccion.crear')}
                                        />
                                    } 
                                />

                                <DataTable 
                                    value={direcciones} 
                                    loading={loading}
                                    paginator 
                                    rows={10}
                                    rowsPerPageOptions={[5, 10, 25]}
                                    paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} direcciones"
                                    globalFilterFields={['nombre', 'descripcion', 'subsecretaria.nombre']}
                                    emptyMessage="No se encontraron direcciones"
                                    responsiveLayout="scroll"
                                >
                                    <Column field="nombre" header="Nombre" sortable style={{ minWidth: '200px' }} />
                                    <Column field="descripcion" header="Descripción" sortable />
                                    <Column 
                                        field="subsecretaria.nombre" 
                                        header="Subsecretaría" 
                                        sortable 
                                        style={{ minWidth: '200px' }} 
                                    />
                                    <Column 
                                        body={(rowData) => actionBodyTemplate(rowData, 'direccion')} 
                                        exportable={false} 
                                        style={{ minWidth: '120px', textAlign: 'center' }} 
                                    />
                                </DataTable>
                            </div>
                        </TabPanel>
                    </TabView>
                </div >

                {/* SECRETARÍA DIALOG */}
                <Dialog
                    visible={secretariaDialog}
                    style={{ width: '450px' }}
                    header={isEditing ? 'Editar Secretaría' : 'Nueva Secretaría'}
                    modal
                    className="p-fluid"
                    footer={
                        <div className="flex justify-content-end gap-2">
                            <Button 
                                label="Cancelar" 
                                icon="pi pi-times" 
                                outlined 
                                onClick={() => setSecretariaDialog(false)} 
                            />
                            <Button 
                                label="Guardar" 
                                icon="pi pi-check" 
                                onClick={saveSecretaria} 
                            />
                        </div>
                    }
                    onHide={() => setSecretariaDialog(false)}
                >
                    <div className="field">
                        <label htmlFor="nombre">Nombre <span className="text-red-500">*</span></label>
                        <InputText
                            id="nombre"
                            value={secretariaForm.nombre}
                            onChange={(e) => setSecretariaForm({ ...secretariaForm, nombre: e.target.value })}
                            className={secretariaErrors.nombre ? 'p-invalid' : ''}
                        />
                        {secretariaErrors.nombre && <small className="p-error">{secretariaErrors.nombre}</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="descripcion">Descripción <span className="text-red-500">*</span></label>
                        <InputTextarea
                            id="descripcion"
                            value={secretariaForm.descripcion}
                            onChange={(e) => setSecretariaForm({ ...secretariaForm, descripcion: e.target.value })}
                            rows={3}
                            className={secretariaErrors.descripcion ? 'p-invalid' : ''}
                        />
                        {secretariaErrors.descripcion && <small className="p-error">{secretariaErrors.descripcion}</small>}
                    </div>
                </Dialog>

                {/* SUBSECRETARÍA DIALOG */}
                <Dialog
                    visible={subsecretariaDialog}
                    style={{ width: '450px' }}
                    header={isEditing ? 'Editar Subsecretaría' : 'Nueva Subsecretaría'}
                    modal
                    className="p-fluid"
                    footer={
                        <div className="flex justify-content-end gap-2">
                            <Button 
                                label="Cancelar" 
                                icon="pi pi-times" 
                                outlined 
                                onClick={() => setSubsecretariaDialog(false)} 
                            />
                            <Button 
                                label="Guardar" 
                                icon="pi pi-check" 
                                onClick={saveSubsecretaria} 
                            />
                        </div>
                    }
                    onHide={() => setSubsecretariaDialog(false)}
                >
                    <div className="field">
                        <label htmlFor="secretaria">Secretaría <span className="text-red-500">*</span></label>
                        <Dropdown
                            id="secretaria"
                            value={subsecretariaForm.secretaria_id}
                            options={secretarias}
                            optionLabel="nombre"
                            optionValue="id"
                            placeholder="Seleccionar secretaría"
                            onChange={(e) => setSubsecretariaForm({ ...subsecretariaForm, secretaria_id: e.value })}
                            className={subsecretariaErrors.secretaria_id ? 'p-invalid' : ''}
                        />
                        {subsecretariaErrors.secretaria_id && <small className="p-error">{subsecretariaErrors.secretaria_id}</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="nombre">Nombre <span className="text-red-500">*</span></label>
                        <InputText
                            id="nombre"
                            value={subsecretariaForm.nombre}
                            onChange={(e) => setSubsecretariaForm({ ...subsecretariaForm, nombre: e.target.value })}
                            className={subsecretariaErrors.nombre ? 'p-invalid' : ''}
                        />
                        {subsecretariaErrors.nombre && <small className="p-error">{subsecretariaErrors.nombre}</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="descripcion">Descripción <span className="text-red-500">*</span></label>
                        <InputTextarea
                            id="descripcion"
                            value={subsecretariaForm.descripcion}
                            onChange={(e) => setSubsecretariaForm({ ...subsecretariaForm, descripcion: e.target.value })}
                            rows={3}
                            className={subsecretariaErrors.descripcion ? 'p-invalid' : ''}
                        />
                        {subsecretariaErrors.descripcion && <small className="p-error">{subsecretariaErrors.descripcion}</small>}
                    </div>
                </Dialog>

                {/* DIRECCIÓN DIALOG */}
                <Dialog
                    visible={direccionDialog}
                    style={{ width: '450px' }}
                    header={isEditing ? 'Editar Dirección' : 'Nueva Dirección'}
                    modal
                    className="p-fluid"
                    footer={
                        <div className="flex justify-content-end gap-2">
                            <Button 
                                label="Cancelar" 
                                icon="pi pi-times" 
                                outlined 
                                onClick={() => setDireccionDialog(false)} 
                            />
                            <Button 
                                label="Guardar" 
                                icon="pi pi-check" 
                                onClick={saveDireccion} 
                            />
                        </div>
                    }
                    onHide={() => setDireccionDialog(false)}
                >
                    <div className="field">
                        <label htmlFor="subsecretaria">Subsecretaría <span className="text-red-500">*</span></label>
                        <Dropdown
                            id="subsecretaria"
                            value={direccionForm.subsecretaria_id}
                            options={subsecretarias}
                            optionLabel="nombre"
                            optionValue="id"
                            placeholder="Seleccionar subsecretaría"
                            onChange={(e) => setDireccionForm({ ...direccionForm, subsecretaria_id: e.value })}
                            className={direccionErrors.subsecretaria_id ? 'p-invalid' : ''}
                        />
                        {direccionErrors.subsecretaria_id && <small className="p-error">{direccionErrors.subsecretaria_id}</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="nombre">Nombre <span className="text-red-500">*</span></label>
                        <InputText
                            id="nombre"
                            value={direccionForm.nombre}
                            onChange={(e) => setDireccionForm({ ...direccionForm, nombre: e.target.value })}
                            className={direccionErrors.nombre ? 'p-invalid' : ''}
                        />
                        {direccionErrors.nombre && <small className="p-error">{direccionErrors.nombre}</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="descripcion">Descripción <span className="text-red-500">*</span></label>
                        <InputTextarea
                            id="descripcion"
                            value={direccionForm.descripcion}
                            onChange={(e) => setDireccionForm({ ...direccionForm, descripcion: e.target.value })}
                            rows={3}
                            className={direccionErrors.descripcion ? 'p-invalid' : ''}
                        />
                        {direccionErrors.descripcion && <small className="p-error">{direccionErrors.descripcion}</small>}
                    </div>
                </Dialog>
            </div>
        </div>
    );
}
