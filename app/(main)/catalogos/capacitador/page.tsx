'use client';
import React, { useEffect, useState } from 'react';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { useRouter } from 'next/navigation';
import * as Yup from 'yup';

import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { confirmPopup } from 'primereact/confirmpopup';
import { MenuItem } from 'primereact/menuitem';

// Components
import { PermissionGuard } from '@/src/components/PermissionGuard';
import { AccessDenied } from '@/src/components/AccessDenied';
import CustomBreadcrumb from '@/src/components/CustomBreadcrumb';

// Services, Hooks, Contexts, Types
import { useAuth } from '@/layout/context/authContext';
import { useNotification } from '@/layout/context/notificationContext';
import { CapacitadorService } from '@/src/services/catalogos';
import type { Capacitador } from '@/types';
import { usePermissions } from '@/src/hooks/usePermissions';
import { generateUUID } from '@/src/utils'



const CapacitadorPage = () => {

    const { isSuperAdmin, canUpdate, canDelete, canCreate } = usePermissions();
    const accessCreate = isSuperAdmin || canCreate('catalogos.capacitadores');
    const accessEdit = isSuperAdmin || canUpdate('catalogos.capacitadores');
    const accessDelete = isSuperAdmin || canDelete('catalogos.capacitadores');


    const [capacitadores, setCapacitadores] = useState<Capacitador[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [rowsEditing, setRowsEditing] = useState<any>({});
    const [editBuffer, setEditBuffer] = useState<{ [key: string]: any }>({});
    const [loadingSaveRows, setLoadingSaveRows] = useState<any>({});
    const [deletingRows, setDeletingRows] = useState<any>({});
    const [rowErrors, setRowErrors] = useState<{ [key: string]: string | null }>({});
    const { showError, showSuccess } = useNotification();
    

    const rowSchema = Yup.object().shape({
        nombre: Yup.string().required('El nombre es obligatorio'),
        descripcion: Yup.string().required('La descripción es obligatorio'),
    });
    

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            let _filters = { ...filters };

            (_filters['global'] as any).value = value;
    
            setFilters(_filters);
            setGlobalFilterValue(value);
    };
    
    const clearFilter = () => {
        initFilters();
    };

    const renderHeader = () => {
        return (
            <div className="flex flex-column md:flex-row justify-content-between gap-1">
                    <div className="flex flex-auto gap-2 ">
                        <Button type="button" icon="pi pi-filter-slash" label="Limpiar" outlined onClick={clearFilter} />
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Busqueda por palabras" />
                    </span>
                    </div>
                    <div className="flex flex-grow-1 justify-content-start md:justify-content-end">
                        <Button
                            className="w-auto" 
                            type="button" 
                            icon="pi pi-plus" 
                            label="Agregar" 
                            onClick={onAgregar}/>
                    </div>
            </div>
        );
    };

    const onAgregar = () => {

        const uuid = generateUUID();
        const nuevo:any = {
    
            id:null,
            nombre: '',
            descripcion: '',
            keyString:uuid,
        }
        setCapacitadores(prev => [nuevo, ...prev]); 
        setRowsEditing((prev:any) => ({ ...prev, [nuevo.keyString]: true }));
        setEditBuffer((prev:any) => ({
            ...prev,
            [uuid]: {...nuevo}
        }));
          
    }

    useEffect(() => {

        const fetchCapacitadores = async () => {
            try {
                setLoading(true);
                const response = await CapacitadorService.getListCapacitador();
                const filtrados = response.data.map((capacitador:any) => {
                    return {
                        ...capacitador,
                        keyString:generateUUID()
                    }
                });
                setCapacitadores(filtrados);
                setLoading(false);
                initFilters();
            } catch (error:any) {
               const message = error?.response?.data?.message || error?.message || 'Error al cargar los capacitadores';
               showError('Error', message);
               setCapacitadores([]);
            } finally {
                setLoading(false);
            }
        }

        fetchCapacitadores();  
    }, [showError]);

    const initFilters = () => {

        setFilters({
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            nombre: {
                operator: FilterOperator.AND,
                constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
            }
        });
        setGlobalFilterValue('');
    };

    const header = renderHeader();

    const handleDelete = async(event:any, e:any) => {
        
         confirmPopup({
            target: event.currentTarget,
            message: '¿Esta seguro de realizar esta acción?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Si',
            rejectLabel: 'No',
            accept: async () => {
                try {

                    let { data, index } = e;
                    setDeletingRows({ [data.keyString]: true });
                    const response:any = await CapacitadorService.deleteCapacitador(data.id);
                    const createdCapacitador = await response.data;

                    updateRows({ ...createdCapacitador, keyString: data.keyString }, index, true);
                    cleanRowsDeleting(data);
                    showSuccess('Capacitador eliminado correctamente');

                } catch (error:any) {

                    showError(error.message || 'Ha ocurrido un error al intentar eliminar registro');
                    return;
                }    
            },
        });
        

    }
    const validarFormulario = async (e: any) => {

        const data = e;
        try {
            await rowSchema.validate(data, { abortEarly: false });
            // Limpia el error si la validación es exitosa
            setRowErrors(prev => ({ ...prev, [data.keyString]: {} }));
            return {};
        } catch (validationError: any) {

            const fieldErrors: { [field: string]: string } = {};
            if (validationError.inner) {
                validationError.inner.forEach((err: any) => {
                    if (err.path) fieldErrors[err.path] = err.message;
                });
            }
            setRowErrors(prev => ({
                ...prev,
                [data.keyString]: fieldErrors
            }));
            // Evita que la fila salga del modo edición
            setRowsEditing((prev:any) => ({ ...prev, [data.keyString]: true }));
            return fieldErrors;
        }
    };

    const handleSave = async (e:any) => {

        let { data, index } = e;
     
        const formulario = editBuffer[data.keyString];
        const errors = await validarFormulario( { ...formulario, keyString:data.keyString } ); 

        if (Object.keys(errors).length > 0) {
            return;
        }
        
        setLoadingSaveRows((prev:any) => ({ ...prev, [data.keyString]: true }));

        const contexto = {
            nombre: formulario.nombre,
            descripcion: formulario.descripcion
        };
  
        if (!data.id) {
            try {

               const response:any = await CapacitadorService.createCapacitador(contexto);
               const createdCapacitador = await response.data;

               updateRows({ ...createdCapacitador, keyString: data.keyString }, index);
               cleanRowsLoading(data); 
               cleanRowsEditing(data);
               showSuccess('Capacitador creada correctamente');

            } catch (error:any) {

                showError(error.message || 'Error al crear la Capacitador');
                return;
            }

        } else {
            try {
             
                const response = await CapacitadorService.updateCapacitador(formulario.id,contexto);
                const updatedCapacitador = await response.data;
             
                updateRows({ ...updatedCapacitador, keyString: data.keyString }, index);
                cleanRowsLoading(data);
                cleanRowsEditing(data);
                showSuccess('Capacitador actualizada correctamente');
                
            } catch( error:any) {

                showError('Error', error.message || 'Error al actualizar la Capacitador');
                return;
            }
        }
            
    };

    const cleanRowsEditing = (data:any) => {

        setRowsEditing((prev:any) => {
            const newRowsEditing = { ...prev };
            delete newRowsEditing[data.keyString];
            return newRowsEditing;
        });
    }

    const cleanRowsDeleting = (data:any) => {

        setRowsEditing((prev:any) => {
            const newRowsDeleting = { ...prev };
            delete newRowsDeleting[data.keyString];
            return newRowsDeleting;
        });
    }

    const cleanRowsLoading = (data:any) => {

        setLoadingSaveRows((prev:any) => {
            const newRows = { ...prev };
            delete newRows[data.keyString];
            return newRows;
        });
    }

    const updateRows = (data:any, index:any, isDelete:boolean=false) => {

        setCapacitadores((prev:any) => {

            let updatedCapacitadores = [...prev];
            if(isDelete) {
                updatedCapacitadores = updatedCapacitadores.filter((Capacitador:any, idx:any) => index !== idx)
            } else {
                updatedCapacitadores[index] = {
                    ...data,
                };
            }
            return updatedCapacitadores;
        });
    }

    const onRowEditInit = (e:any) => {

        const data = e.data;
        setRowsEditing((prev:any) => ({ ...prev, [data.keyString]: true }));
        setEditBuffer((prev:any) => ({
            ...prev,
            [data.keyString]: {...data}
        }));  
    };

    const onRowEditCancel = (e:any) => {

        const data = e.data;
        setRowsEditing((prev:any) => {
            const newRowsEditing = { ...prev };
            delete newRowsEditing[data.keyString];
            return newRowsEditing;
        });

         setEditBuffer((prev:any) => {
            const newEditBuffer = { ...prev };
            delete newEditBuffer[data.keyString];
            return newEditBuffer;
        });

       
        if(!data.id) {
            setCapacitadores((prev:any) => prev.filter((item:any) => item.keyString !== data.keyString)); 
        }
    };

    const textEditor = (options:any) =>{  
        return (
         <div>
            <InputText
                className='w-full'
                value={editBuffer[options.rowData.keyString]?.[options.field] ?? options.value}
                onChange={e =>{ 
                    setEditBuffer((prev:any) => ({
                        ...prev,
                        [options.rowData.keyString]: {
                        ...prev[options.rowData.keyString],
                        [options.field]: e.target.value
                        }
                    }));
                }}
                
            />
            {rowErrors[options.rowData.keyString]?.[options.field] && (
            <span style={{ color: 'red' }}>
                { rowErrors[options.rowData.keyString]?.[options.field]}
            </span>)}
        </div>
    )};

    const textAreaEditor = (options:any) => (
         <div>
            <InputTextarea
                className='w-full'
                value={editBuffer[options.rowData.keyString]?.[options.field] ?? options.value}
                onChange={e => {
                     setEditBuffer((prev:any) => ({
                        ...prev,
                        [options.rowData.keyString]: {
                        ...prev[options.rowData.keyString],
                        [options.field]: e.target.value
                        }
                    }));
                }}
            />
           {rowErrors[options.rowData.keyString]?.[options.field] && (
            <span style={{ color: 'red' }}>
                { rowErrors[options.rowData.keyString]?.[options.field]}
            </span>)
           }
        </div>
    );

    const rowEditorTemplate = (rowData:any, options:any, customHandlers:any) => {

        const isRowEditing = customHandlers.isEditing;
        if (isRowEditing) {
            
            return (
                <div className="flex align-items-center justify-content-center gap-2">
                    <Button
                        icon="pi pi-save" 
                        size='small'
                        loading={loadingSaveRows[rowData.keyString]}
                        disabled={loadingSaveRows[rowData.keyString]}
                        loadingIcon="pi pi-spinner"
                        severity='success'
                        onClick={() => customHandlers.onSave({ data: rowData, index: options.rowIndex, newData: options.props.value })} 
                    />
                    <Button
                        icon="pi pi-times" 
                        size='small'
                        severity="danger"
                        disabled={loadingSaveRows[rowData.keyString]}
                        outlined
                        onClick={() => customHandlers.onCancel({ data: rowData, index: options.rowIndex })} 
                    />
                </div>
            );
        } else {
    
            return (
                <div className="flex align-items-center justify-content-center gap-2">
                    { accessEdit && (
                        <Button
                            icon="pi pi-pencil" 
                            size='small'
                            onClick={() => customHandlers.onInit({ data: rowData, index: options.rowIndex })} 
                        />
                    )}
                    { accessDelete && (
                        <Button
                            icon="pi pi-trash" 
                            size='small'
                            severity='danger'
                            loading={deletingRows[rowData.keyString]}
                            onClick={(event) => customHandlers.onDelete(event,{ data: rowData, index: options.rowIndex })} 
                        />
                    )}
                </div>
            );
        }
    };

    // Breadcrumb items
    const breadcrumbItems: MenuItem[] = [
        { label: 'Catalogos', icon: 'pi pi-briefcase' },
        { label: 'Capacitadores', icon: 'pi pi-user-edit' }
    ];

    return (
        <PermissionGuard
            resource='catalogos.capacitadores'
            action='acceso'
            fallback={<AccessDenied variant="detailed" message="No tienes acceso a esta modulo"/>}>
            <div className="grid">
                <div className="col-12">
                    <CustomBreadcrumb
                        items={breadcrumbItems}
                        theme="blue"
                        title="Catálogo de Capacitadores"
                        description="Administra el catálogo de capacitadores"
                        icon="pi pi-th-large"
                    />
                    <div className="bg-white border border-gray-200  overflow-hidden border-round-xl shadow-2 bg-white">
                        <DataTable
                            value={capacitadores}
                            paginator
                            rows={10}
                            dataKey="keyString"
                            filters={filters}
                            filterDisplay="menu"
                            loading={loading}
                            emptyMessage="No se encontraron registros."
                            editMode='row'
                            editingRows={rowsEditing}
                            onRowEditInit={onRowEditInit}
                            onRowEditCancel={onRowEditCancel}
                            onRowEditChange={e => setRowsEditing(e.data)}
                            header={header}
                        >
                            <Column 
                                field="nombre" 
                                header="Nombre" 
                                editor={(options) => textEditor(options)}
                                filter 
                                filterPlaceholder="Busqueda por nombre" 
                                style={{ maxWidth: '4rem' }} /> 
                            <Column 
                                field="descripcion" 
                                header="Descripción" 
                                editor={(options) => textAreaEditor(options)}
                                style={{ maxWidth: '8rem' }}
                                />                        
                            <Column 
                                rowEditor
                                body={(rowData, options) => rowEditorTemplate(rowData, options, {
                                    onInit:onRowEditInit,
                                    onSave:handleSave,
                                    onCancel:onRowEditCancel,
                                    onDelete:handleDelete,
                                    isEditing: !!rowsEditing[rowData.keyString]
                                })}
                                bodyClassName="text-center" 
                                
                                style={{ maxWidth: '2rem' }} />
                        </DataTable>
                    </div>
                </div>
            </div>
        </PermissionGuard>
    );
};

export default CapacitadorPage;
