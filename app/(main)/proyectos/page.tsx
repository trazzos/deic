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
import { Dropdown } from 'primereact/dropdown';
import { confirmPopup } from 'primereact/confirmpopup';
import { Sidebar } from 'primereact/sidebar';
import { useNotification } from '@/layout/context/notificationContext';

import { DepartamentoService, TipoProyectoService } from '@/src/services/catalogos';
import { ProyectoService } from '@/src/services/proyecto';
import { generateUUID } from '@/src/utils'


interface Proyecto {
    uuid:string|null,
    tipoProyecto:number|null,
    departamento:number|null,
    nombre:string,
    descripcion:string
}
const ProyectoPage = () => {

    const router = useRouter();
    const [proyectos, setProyectos] = useState<any[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [tiposProyecto, setTiposProyecto] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingGuardar, setLoadingGuardar] = useState(false);
    const [visibleFormulario, setVisibleFormulario] = useState(false);
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [deletingRows, setDeletingRows] = useState<any>({});
    const { showError, showSuccess } = useNotification();
    
    
    const formularioSchema = Yup.object().shape({
        tipoProyecto: Yup.string().required('El tipo de proyecto es obligatorio'),
        departamento: Yup.string().required('El departamento es obligatorio'),
        nombre: Yup.string().required('El nombre es obligatorio'),
        descripcion: Yup.string().required('La descripción es obligatoria'),
    });

    const initStateFormularioProyecto = {
        uuid:null,
        tipoProyecto:null,
        departamento:null,
        nombre: '',
        descripcion: '',
    };
    const [formularioProyecto, setFormularioProyecto] = useState<Proyecto>(initStateFormularioProyecto);
    const [formularioErrors, setFormularioErrors] = useState<{ [key: string]: string }>({});

    // Handlers
    const handleFormularioChange = (e: any) => {

        const name = e.target?.name ?? e.originalEvent?.target?.name;
        const value = e.value ?? e.target?.value;
        setFormularioProyecto(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSaveData = async () => {

        setLoadingGuardar(true);

        try {
          
            await formularioSchema.validate(formularioProyecto, { abortEarly: false });
            setFormularioErrors({});

            const contexto =  {
                tipo_proyecto_id: formularioProyecto.tipoProyecto,
                departamento_id: formularioProyecto.departamento,
                nombre:formularioProyecto.nombre,
                descripcion: formularioProyecto.descripcion
            }
            const response:any = formularioProyecto.uuid 
                ? await ProyectoService.updateProyecto(formularioProyecto.uuid, contexto)
                : await ProyectoService.createProyecto(contexto);
            const proyecto = await response.data;

            updateRows(proyecto);
            showSuccess('Proyecto guardado correctamente');
            setVisibleFormulario(false);

        } catch (err: any) {

            if (err.inner) {
                const errors: { [key: string]: string } = {};
                err.inner.forEach((validationError: any) => {
                    if (validationError.path) {
                        errors[validationError.path] = validationError.message;
                    }
                });
                setFormularioErrors(errors);
            } else 
                showError('Ha ocurrido un error, intente nuevamente');
        } finally {
           setLoadingGuardar(false);
        };
    };

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
                    setDeletingRows({ [data.uuid]: true });
                    await ProyectoService.deleteProyecto(data.uuid);
                    updateRows(data, true);
                    cleanRowsDeleting(data);
                    showSuccess('Proyecto eliminado correctamente');

                } catch (error:any) {

                    showError(error.message || 'Ha ocurrido un error al intentar eliminar registro');
                    return;
                }    
            },
        });
    }
    
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

    const onAgregar = () => {

      setFormularioProyecto(initStateFormularioProyecto);  
      setVisibleFormulario(true);  
    }

    useEffect(() => {

        setLoading(true);
        
        DepartamentoService.getListDepartamento()
        .then((response) => {
            setDepartamentos(response.data);
        })
        .catch((_error) => {
            console.log('catch','Error al cargar departamentos')
        });

        TipoProyectoService.getListTipoProyecto()
        .then((response) => {
            setTiposProyecto(response.data);
        })
        .catch((_error) => {
            console.log('catch','Error al cargar tipos de proyecto')
        });
        

        ProyectoService.getListProyecto().then((response) => {
            const filtrados = response.data.map((proyecto:any) => {
                return {
                    ...proyecto,
                }
            });
            setProyectos(filtrados);
            setLoading(false);
            initFilters();
        });
    }, []);

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

    const cleanRowsDeleting = (data:any) => {

        setDeletingRows((prev:any) => {
            const newRowsDeleting = { ...prev };
            delete newRowsDeleting[data.uuid];
            return newRowsDeleting;
        });
    }

    const updateRows = (data:any, isDelete:boolean=false) => {

        setProyectos((prev:any) => {

            let updatedProyectos = [...prev];
            const index = updatedProyectos.findIndex((pro) => pro.uuid === data.uuid);

            if(isDelete) {
                updatedProyectos = updatedProyectos.filter((_proyecto:any, idx:any) => index !== idx)
            } else {
                if(index !== -1) {
                    updatedProyectos[index] = {
                        ...data,
                    }; 
                } else {
                    updatedProyectos = [...updatedProyectos, data];
                }
                
            }
            return updatedProyectos;
        });
    }

    const onEditProyecto = (e:any) => {

        const data = e.data;
        setFormularioProyecto((_prev:any) => ({
            uuid:data.uuid,
            tipoProyecto:data.tipo_proyecto_id,
            departamento: data.departamento_id,
            nombre:data.nombre,
            descripcion: data.descripcion
        }));
        setVisibleFormulario(true);
       
    };

    // Custom templates 

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

    const actionsTemplate = (rowData:any, options:any, customHandlers:any) => (
        <div className="flex align-items-center justify-content-center gap-2">
            <Button
                icon="pi pi-pencil" 
                size='small'
                onClick={() => customHandlers.onEdit({ data: rowData, index: options.rowIndex })} 
            />
            <Button
                icon="pi pi-trash" 
                size='small'
                severity='danger'
                loading={deletingRows[rowData.uuid]}
                onClick={(event) => customHandlers.onDelete(event,{ data: rowData, index: options.rowIndex })} 
            />
            <Button
                icon="pi pi-list"
                size="small"
                severity="info"
                tooltip="Ver actividades"
                onClick={() => router.push(`/proyectos/${rowData.uuid}/actividades`)}
            />
        </div>
    );

    const customHeader =(
          <div className="flex align-items-center justify-content-between surface-border">
            <h2 className="m-0 text-xl font-semibold">{ formularioProyecto.uuid ? 'Actualizar proyecto' : 'Registrar nuevo proyecto'}</h2>
        </div>
    )

    const header = renderHeader();

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>Lista de proyectos</h5>
                    <DataTable
                        value={proyectos}
                        paginator
                        rows={10}
                        dataKey="id"
                        filters={filters}
                        filterDisplay="menu"
                        loading={loading}
                        emptyMessage="No se encontraron registros."
                        editMode='row'
                        header={header}
                    >
                        <Column 
                            field="tipo_proyecto_nombre" 
                            header="Tipo proyecto" 
                            filter 
                            filterPlaceholder="Busqueda por departamento" 
                            style={{ maxWidth: '4rem' }} />

                        <Column 
                            field="departamento_nombre" 
                            header="Departamento" 
                            filter 
                            filterPlaceholder="Busqueda por tipo" 
                            style={{ maxWidth: '4rem' }} /> 
                        
                        <Column 
                            field="nombre" 
                            header="Nombre" 
                            filter 
                            filterPlaceholder="Busqueda por nombre" 
                            style={{ maxWidth: '4rem' }} />  

                        <Column 
                            field="descripcion" 
                            header="Descripción" 
                            style={{ maxWidth: '8rem' }}
                            />                        
                        <Column 
                            body={(rowData, options) => actionsTemplate(rowData, options, {
                                onEdit:onEditProyecto,
                                onDelete:handleDelete
                            })}
                            bodyClassName="text-center" 
                            style={{ maxWidth: '2rem' }} />
                    </DataTable>
                </div>
                <Sidebar 
                    visible={visibleFormulario} 
                    onHide={() => setVisibleFormulario(false)} 
                    baseZIndex={1000} 
                    position="right"
                    modal={true}
                    dismissable={false}
                    className="w-full md:w-20rem lg:w-30rem"
                    header={customHeader}
                    >
                    <div className="flex flex-column h-full">
                        <div className='flex flex-column justify-content-beetwen gap-4'>
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="" className='font-medium'>Tipo de proyecto <span className='text-red-600'>*</span></label>
                                    <Dropdown 
                                              name="tipoProyecto"
                                              value={formularioProyecto.tipoProyecto}
                                              onChange={handleFormularioChange}
                                              options={tiposProyecto} 
                                              optionLabel="nombre" 
                                              optionValue='id'
                                              placeholder="Seleccione una opción" 
                                              className="w-full"/>
                                    {formularioErrors.tipoProyecto && (
                                        <small className='text-red-600'>{formularioErrors.tipoProyecto}</small>
                                    )}
                                </div>
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="" className='font-medium'>Departamento <span className='text-red-600'>*</span></label>
                                      <Dropdown 
                                              name="departamento"
                                              value={formularioProyecto.departamento}
                                              onChange={handleFormularioChange}
                                              options={departamentos} 
                                              optionLabel="nombre" 
                                              optionValue="id"
                                              placeholder="Seleccione una opción" 
                                              className="w-full"/>
                                    {formularioErrors.departamento && (
                                        <small className='text-red-600'>{formularioErrors.departamento}</small>
                                    )}
                                </div>
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="" className='font-medium'>Nombre <span className='text-red-600'>*</span></label>
                                    <InputText  
                                        name="nombre"
                                        value={formularioProyecto.nombre}
                                        onChange={handleFormularioChange}></InputText>
                                    {formularioErrors.nombre && (
                                        <small className='text-red-600'>{formularioErrors.nombre}</small>
                                    )}
                                </div>
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="" className='font-medium'>Descripción <span className='text-red-600'>*</span></label>
                                    <InputTextarea 
                                        name="descripcion"
                                        value={formularioProyecto.descripcion}
                                        onChange={handleFormularioChange} rows={10}></InputTextarea>
                                    {formularioErrors.descripcion && (
                                        <small className='text-red-600'>{formularioErrors.descripcion}</small>
                                    )}
                                </div>
                        </div>
                        <div className="mt-auto">
                            <hr className="mb-3 mx-2 border-top-1 border-none surface-border" />
                            <div className='flex justify-content-between align-items-center gap-2'>
                                <Button label="Cancelar" 
                                        icon="pi pi-times"
                                        severity='danger'
                                        disabled={loadingGuardar} 
                                        onClick={() => setVisibleFormulario(false)}>
                                </Button>
                                <Button label="Guardar" 
                                        icon="pi pi-save"
                                        loading={loadingGuardar}
                                        disabled={loadingGuardar} 
                                        onClick={handleSaveData}></Button>
                            </div>
                        </div>
                    </div>
                </Sidebar>
            </div>
        </div>
    );
};

export default ProyectoPage;
