'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { confirmPopup } from 'primereact/confirmpopup';
import { TabView, TabPanel } from 'primereact/tabview';
import * as Yup from 'yup';

import PermissionGuard from "@/src/components/PermissionGuard";
import AccessDenied from "@/src/components/AccessDenied";
import { CustomBreadcrumb } from '@/src/components/CustomBreadcrumb';

import { usePermissions } from '@/src/hooks/usePermissions';
import { useNotification } from '@/layout/context/notificationContext';
import { OrganizacionService, DepartamentoService } from '@/src/services';
import { Secretaria, Subsecretaria, Direccion, Departamento } from '@/types/organizacion';

// Using mock service for development - replace with OrganizacionService for production
//const OrganizacionService = mockOrganizacionService;

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

const departamentoSchema = Yup.object().shape({
    nombre: Yup.string().required('El nombre es obligatorio'),
    descripcion: Yup.string().required('La descripción es obligatoria'),
    direccion_id: Yup.number().required('La direccion es obligatoria')
});

export default function OrganizacionPage() {
    // Access
    const { isSuperAdmin, canUpdate, canDelete, canCreate, hasPermission, canManage } = usePermissions();
    const accessSecretaria = isSuperAdmin || canManage('catalogos.organizacion.secretarias');
    const accessCreateSecretaria = isSuperAdmin || canCreate('catalogos.organizacion.secretarias');
    const accessEditSecretaria = isSuperAdmin || canUpdate('catalogos.organizacion.secretarias');
    const accessDeleteSecretaria = isSuperAdmin || canDelete('catalogos.organizacion.secretarias');

    const accessSubsecretaria = isSuperAdmin || canManage('catalogos.organizacion.subsecretarias');
    const accessCreateSubsecretaria = isSuperAdmin || canCreate('catalogos.organizacion.subsecretarias');
    const accessEditSubsecretaria = isSuperAdmin || canUpdate('catalogos.organizacion.subsecretarias');
    const accessDeleteSubsecretaria = isSuperAdmin || canDelete('catalogos.organizacion.subsecretarias');

    const accessDireccion = isSuperAdmin || canManage('catalogos.organizacion.direcciones');
    const accessCreateDireccion = isSuperAdmin || canCreate('catalogos.organizacion.direcciones');
    const accessEditDireccion = isSuperAdmin || canUpdate('catalogos.organizacion.direcciones');
    const accessDeleteDireccion = isSuperAdmin || canDelete('catalogos.organizacion.direcciones');

    const accessDepartamento = isSuperAdmin || canManage('catalogos.organizacion.departamentos');
    const accessCreateDepartamento = isSuperAdmin || canCreate('catalogos.organizacion.departamentos');
    const accessEditDepartamento = isSuperAdmin || canUpdate('catalogos.organizacion.departamentos');
    const accessDeleteDepartamento = isSuperAdmin || canDelete('catalogos.organizacion.departamentos');

    // Filters
    const [filtersSecretaria, setFiltersSecretaria] = useState<DataTableFilterMeta>({});
    const [globalFilterValueSecretaria, setGlobalFilterValueSecretaria] = useState('');

    // States
    const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
    const [subsecretarias, setSubsecretarias] = useState<Subsecretaria[]>([]);
    const [direcciones, setDirecciones] = useState<Direccion[]>([]);
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    // Dialog states
    const [secretariaDialog, setSecretariaDialog] = useState(false);
    const [subsecretariaDialog, setSubsecretariaDialog] = useState(false);
    const [direccionDialog, setDireccionDialog] = useState(false);
    const [departamentoDialog, setDepartamentoDialog] = useState(false);

    // Form states
    const [secretariaForm, setSecretariaForm] = useState<Secretaria>({ nombre: '', descripcion: '' });
    const [subsecretariaForm, setSubsecretariaForm] = useState<Subsecretaria>({ nombre: '', descripcion: '', secretaria_id: 0 });
    const [direccionForm, setDireccionForm] = useState<Direccion>({ nombre: '', descripcion: '', subsecretaria_id: 0 });
    const [departamentoForm, setDepartamentoForm] = useState<Departamento>({ nombre: '', descripcion: '', direccion_id: 0 });

    // Error states
    const [secretariaErrors, setSecretariaErrors] = useState<any>({});
    const [subsecretariaErrors, setSubsecretariaErrors] = useState<any>({});
    const [direccionErrors, setDireccionErrors] = useState<any>({});

    const [isEditing, setIsEditing] = useState(false);

    //Loading states
    const [savingSecretaria, setSavingSecretaria] = useState(false);
    const [savingSubsecretaria, setSavingSubsecretaria] = useState(false);
    const [savingDireccion, setSavingDireccion] = useState(false);
    const [savingDepartamento, setSavingDepartamento] = useState(false);

    const { showSuccess, showError } = useNotification();

    const breadcrumbItems = [
        { label: 'Catálogos', url: '/catalogos' },
        { label: 'Dependencias' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {

        if (!hasPermission('catalogos.organizacion')) return;
        
        setLoading(true);
        try {
            const [secretariasRes, subsecretariasRes, direccionesRes, departamentoRes] = await Promise.all([
                OrganizacionService.getSecretarias(),
                OrganizacionService.getSubsecretarias(),
                OrganizacionService.getDirecciones(),
                DepartamentoService.getListDepartamento(),
            ]);

            setSecretarias(secretariasRes.data);
            setSubsecretarias(subsecretariasRes.data);
            setDirecciones(direccionesRes.data);
            setDepartamentos(departamentoRes.data);
        } catch (error) {
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
        setSavingSecretaria(true);
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
        } finally {
            setSavingSecretaria(false);
        }
    };

    const deleteSecretaria = (event:any, secretaria: Secretaria) => {
        confirmPopup({
            target: event.currentTarget,
            message: `¿Está seguro de eliminar la secretaría?`,
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
        setSubsecretariaForm({ ...subsecretaria, secretaria_id: subsecretaria.secretaria?.id || 0 });
        setSubsecretariaErrors({});
        setIsEditing(true);
        setSubsecretariaDialog(true);
    };

    const saveSubsecretaria = async () => {
        setSavingSubsecretaria(true);
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
        } finally {
            setSavingSubsecretaria(false);
        }
    };

    const deleteSubsecretaria = (event: any, subsecretaria: Subsecretaria) => {
        confirmPopup({
            target: event.currentTarget,
            message: `¿Está seguro de eliminar la subsecretaría?`,
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
        setDireccionForm({ ...direccion, subsecretaria_id: direccion.subsecretaria?.id || 0 });
        setDireccionErrors({});
        setIsEditing(true);
        setDireccionDialog(true);
    };

    const saveDireccion = async () => {
        setSavingDireccion(true);
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
        } finally {
            setSavingDireccion(false);
        }
    };

    const deleteDireccion = (event:any, direccion: Direccion) => {

        if (!direccion.id) return;
        
        confirmPopup({
            target: event.currentTarget,
            message: `¿Está seguro de eliminar la dirección?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                try {
                    const direccionId =  direccion.id!;
                    await OrganizacionService.deleteDireccion(direccionId);
                    setDirecciones(prev => prev.filter(item => item.id !== direccionId));
                    showSuccess('Dirección eliminada correctamente');
                } catch (error) {
                    showError('Error al eliminar la dirección');
                }
            }
        });
    };

    // DEPARTAMENTOS CRUD
    const openNewDepartamento = () => {
        setDepartamentoForm({ nombre: '', descripcion: '', direccion_id: 0 });
        setIsEditing(false);
        setDepartamentoDialog(true);
    };
    const editDepartamento = (departamento: Departamento) => {
        setDepartamentoForm({ ...departamento, direccion_id: departamento.direccion?.id || 0 });
        setIsEditing(true);
        setDepartamentoDialog(true);
    };

    const saveDepartamento = async () => {
        setSavingDepartamento(true);
        try {
            await departamentoSchema.validate(departamentoForm, { abortEarly: false });

            if (isEditing && departamentoForm.id) {
                const response = await DepartamentoService.updateDepartamento(departamentoForm.id, departamentoForm);
                setDepartamentos(prev => prev.map(item => item.id === departamentoForm.id ? response.data : item));
                showSuccess('Departamento actualizado correctamente');
            } else {
                const response = await DepartamentoService.createDepartamento(departamentoForm);
                setDepartamentos(prev => [...prev, response.data]);
                showSuccess('Departamento creado correctamente');
            }

            setDepartamentoDialog(false);
        } catch (error: any) {
            if (error.inner) {
                const errors: any = {};
                error.inner.forEach((err: any) => {
                    if (err.path) errors[err.path] = err.message;
                });
                //setDepartamentoErrors(errors); // You can implement error state for departamentos if needed
            } else {
                showError('Error al guardar el departamento');
            }
        } finally {
            setSavingDepartamento(false);
        }
    };
    const deleteDepartamento = (event:any, departamento: Departamento) => {

        if (!departamento.id) return;

        confirmPopup({
            target: event.currentTarget,
            message: `¿Está seguro de eliminar el departamento?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                try {
                    const departamentoId =  departamento.id!;
                    await DepartamentoService.deleteDepartamento(departamentoId);
                    setDepartamentos(prev => prev.filter(item => item.id !== departamentoId));
                    showSuccess('Departamento eliminado correctamente');
                } catch (error) {
                    showError('Error al eliminar el departamento');
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

    const headerSubsecretaria = (
        <div className="flex flex-column md:flex-row justify-content-between gap-1">
            <div className="flex flex-auto gap-2 ">
                <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined />
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Busqueda por palabras" />
                </span>
            </div>
            <div className="flex flex-grow-1 justify-content-start md:justify-content-end">
                { accessCreateSubsecretaria && (
                    <Button
                        className="w-auto"
                        type="button"
                        icon="pi pi-plus"
                        label="Agregar"
                        onClick={openNewSubsecretaria}
                    />
                )}
            </div>
        </div>
    );

    const headerDireccion = (
        <div className="flex flex-column md:flex-row justify-content-between gap-1">
            <div className="flex flex-auto gap-2 ">
                <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined />
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Busqueda por palabras" />
                </span>
            </div>
            <div className="flex flex-grow-1 justify-content-start md:justify-content-end">
                { accessCreateDireccion && (
                    <Button
                        className="w-auto"
                        type="button"
                        icon="pi pi-plus"
                        label="Agregar"
                        onClick={openNewDireccion}
                    />
                )}
            </div>
        </div>
    );

    const headerDepartamento = (
        <div className="flex flex-column md:flex-row justify-content-between gap-1">
            <div className="flex flex-auto gap-2 ">
                <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined />
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Busqueda por palabras" />
                </span>
            </div>
            <div className="flex flex-grow-1 justify-content-start md:justify-content-end">
                { accessCreateDepartamento && (
                    <Button
                        className="w-auto"
                        type="button"
                        icon="pi pi-plus"
                        label="Agregar"
                        onClick={openNewDepartamento}
                    />
                )}
            </div>
        </div>
    );

    const actionSecretariaBodyTemplate = (rowData: any) => {
        return (
            <div className="flex gap-2">
                {accessEditSecretaria && (
                    <Button
                        icon="pi pi-pencil"
                        size="small"
                        onClick={() => editSecretaria(rowData)}
                    />
                )}
                {accessDeleteSecretaria && (
                    <Button
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        onClick={(event) => deleteSecretaria(event,rowData)}
                    />
                )}
            </div>
        );
    };

    const actionSubsecretariaBodyTemplate = (rowData: any) => {
        return (
            <div className="flex gap-2">
                {accessEditSubsecretaria && (
                    <Button
                        icon="pi pi-pencil"
                        size="small"
                        onClick={() => editSubsecretaria(rowData)}
                    />
                )}
                {accessDeleteSubsecretaria && (
                    <Button
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        onClick={(event) => deleteSubsecretaria(event,rowData)}
                    />
                )}
            </div>
        );
    };

    const actionDireccionBodyTemplate = (rowData: any) => {
        return (
            <div className="flex gap-2">
                {accessEditDireccion && (
                    <Button
                        icon="pi pi-pencil"
                        size="small"
                        onClick={() => editDireccion(rowData)}
                    />
                )}
                {accessDeleteDireccion && (
                    <Button
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        onClick={(event) => deleteDireccion(event,rowData)}
                    />
                )}
            </div>
        );
    };

    const actionDepartamentoBodyTemplate = (rowData: any) => {
        return (
            <div className="flex gap-2">
                {accessEditDepartamento && (
                    <Button
                        icon="pi pi-pencil"
                        size="small"
                        onClick={() => editDepartamento(rowData)}
                    />
                )}
                {accessDeleteDepartamento && (
                    <Button
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        onClick={(event) => deleteDepartamento(event,rowData)}
                    />
                )}
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
        <PermissionGuard
            resource='catalogos'
            action='organizacion'
            fallback={<AccessDenied variant="detailed" message="No tienes acceso a esta modulo"/>}
        >
            <div className="surface-ground">
                <div className="flex flex-column gap-4">
                    <CustomBreadcrumb 
                        items={breadcrumbItems}
                        theme="green"
                        title="Dependencias"
                        description="Gestión de las diferentes dependencias de la institución"
                    />
                    <div className='border overflow-hidden border-gray-200 border-round-2xl'>
                        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                            {/* SECRETARÍAS TAB */}
                            { accessSecretaria && 
                                (<TabPanel header="Secretarías" leftIcon="pi pi-building mr-2">
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
                                            <Column field="descripcion" header="Descripción" />
                                            <Column 
                                                body={(rowData) => actionSecretariaBodyTemplate(rowData)} 
                                                exportable={false} 
                                                style={{ minWidth: '120px', textAlign: 'center' }} 
                                            />
                                        </DataTable>
                                        </div>
                                    </div>
                                    </TabPanel>
                                )
                            }

                            {/* SUBSECRETARÍAS TAB */}

                            { accessSubsecretaria && (
                                <TabPanel header="Subsecretarías" leftIcon="pi pi-sitemap mr-2">
                                    <div className="flex flex-column gap-4">
                                        <div className='border border-1 border-gray-100 overflow-hidden border-round-xl'>
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
                                                header={headerSubsecretaria}
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
                                                    body={(rowData) => actionSubsecretariaBodyTemplate(rowData)} 
                                                    exportable={false} 
                                                    style={{ minWidth: '120px', textAlign: 'center' }} 
                                                />
                                        </DataTable>
                                        </div> 
                                    </div>
                                </TabPanel>)
                                
                            }
                            
                            {/* DIRECCIONES TAB */}
                            { accessDireccion && (

                                <TabPanel header="Direcciones" leftIcon="pi pi-users mr-2">
                                    <div className="flex flex-column gap-4">
                                        <div className='border border-1 border-gray-100 overflow-hidden border-round-xl'>
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
                                            header={headerDireccion}
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
                                                body={(rowData) => actionDireccionBodyTemplate(rowData)} 
                                                exportable={false} 
                                                style={{ minWidth: '120px', textAlign: 'center' }} 
                                            />
                                        </DataTable>
                                        </div>

                                        
                                    </div>
                                </TabPanel>)
                            }
                            

                            {/* DEPARTAMENTOS TAB */}
                            { accessDepartamento && (
                                <TabPanel header="Departamentos" leftIcon="pi pi-users mr-2">
                                    <div className="flex flex-column gap-4">
                                        <div className='border border-1 border-gray-100 overflow-hidden border-round-xl'>
                                            <DataTable 
                                            value={departamentos} 
                                            loading={loading}
                                            paginator 
                                            rows={10}
                                            rowsPerPageOptions={[5, 10, 25]}
                                            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} direcciones"
                                            globalFilterFields={['nombre', 'descripcion', 'direccion.nombre']}
                                            emptyMessage="No se encontraron departamentos"
                                            header={headerDepartamento}
                                            responsiveLayout="scroll"
                                        >
                                            <Column field="nombre" header="Nombre" sortable style={{ minWidth: '200px' }} />
                                            <Column field="descripcion" header="Descripción" sortable />
                                            <Column 
                                                field="direccion.nombre" 
                                                header="Dirección" 
                                                sortable 
                                                style={{ minWidth: '200px' }} 
                                            />
                                            <Column 
                                                body={(rowData) => actionDepartamentoBodyTemplate(rowData)} 
                                                exportable={false} 
                                                style={{ minWidth: '120px', textAlign: 'center' }} 
                                            />
                                        </DataTable>
                                        </div>

                                        
                                    </div>
                                </TabPanel>)

                            }
                            
                        </TabView>
                    </div >

                    {/* SECRETARÍA DIALOG */}
                    <Dialog
                        visible={secretariaDialog}
                        style={{ width: '450px' }}
                        header={
                                <div className="flex align-items-center gap-2">
                                    <i className={isEditing ? 'pi pi-pencil text-xl text-primary-600' : 'pi pi-plus text-xl text-primary-600'}></i>
                                    <span className="font-bold text-primary-800">
                                        {isEditing ? 'Editar Secretaría' : 'Crear Secretaría'}
                                    </span>
                                </div>
                        }
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
                                    loading={savingSecretaria}
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
                        header={
                                <div className="flex align-items-center gap-2">
                                    <i className={isEditing ? 'pi pi-pencil text-xl text-primary-600' : 'pi pi-plus text-xl text-primary-600'}></i>
                                    <span className="font-bold text-primary-800">
                                        {isEditing ? 'Editar Subsecretaría' : 'Crear Subsecretaría'}
                                    </span>
                                </div>
                        }
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
                                    loading={savingSubsecretaria}
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
                        header={
                                <div className="flex align-items-center gap-2">
                                    <i className={isEditing ? 'pi pi-pencil text-xl text-primary-600' : 'pi pi-plus text-xl text-primary-600'}></i>
                                    <span className="font-bold text-primary-800">
                                        {isEditing ? 'Editar Dirección' : 'Crear Dirección'}
                                    </span>
                                </div>
                        }
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
                                    loading={savingDireccion}
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

                    {/* DEPARTAMENTO DIALOG */}
                    <Dialog
                        visible={departamentoDialog}
                        style={{ width: '450px' }}
                        header={
                                <div className="flex align-items-center gap-2">
                                    <i className={isEditing ? 'pi pi-pencil text-xl text-primary-600' : 'pi pi-plus text-xl text-primary-600'}></i>
                                    <span className="font-bold text-primary-800">
                                        {isEditing ? 'Editar Departamento' : 'Crear Departamento'}
                                    </span>
                                </div>
                        }
                        modal
                        className="p-fluid"
                        footer={
                            <div className="flex justify-content-end gap-2">
                                <Button 
                                    label="Cancelar" 
                                    icon="pi pi-times" 
                                    outlined 
                                    onClick={() => setDepartamentoDialog(false)} 
                                />
                                <Button 
                                    label="Guardar" 
                                    icon="pi pi-check" 
                                    loading={savingDepartamento}
                                    onClick={saveDepartamento} 
                                />
                            </div>
                        }
                        onHide={() => setDepartamentoDialog(false)}
                    >
                        <div className="field">
                            <label htmlFor="subsecretaria">Dirección <span className="text-red-500">*</span></label>
                            <Dropdown
                                id="direccion"
                                value={departamentoForm.direccion_id}
                                options={direcciones}
                                optionLabel="nombre"
                                optionValue="id"
                                placeholder="Seleccionar subsecretaría"
                                onChange={(e) => setDepartamentoForm({ ...departamentoForm, direccion_id: e.value })}
                                className={direccionErrors.subsecretaria_id ? 'p-invalid' : ''}
                            />
                            {direccionErrors.subsecretaria_id && <small className="p-error">{direccionErrors.subsecretaria_id}</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="nombre">Nombre <span className="text-red-500">*</span></label>
                            <InputText
                                id="nombre"
                                value={departamentoForm.nombre}
                                onChange={(e) => setDepartamentoForm({ ...departamentoForm, nombre: e.target.value })}
                                className={direccionErrors.nombre ? 'p-invalid' : ''}
                            />
                            {direccionErrors.nombre && <small className="p-error">{direccionErrors.nombre}</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="descripcion">Descripción <span className="text-red-500">*</span></label>
                            <InputTextarea
                                id="descripcion"
                                value={departamentoForm.descripcion}
                                onChange={(e) => setDepartamentoForm({ ...departamentoForm, descripcion: e.target.value })}
                                rows={3}
                                className={direccionErrors.descripcion ? 'p-invalid' : ''}
                            />
                            {direccionErrors.descripcion && <small className="p-error">{direccionErrors.descripcion}</small>}
                        </div>
                    </Dialog>
                </div>
            </div>
        </PermissionGuard>
    );
}
