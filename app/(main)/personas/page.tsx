'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as Yup from 'yup';

// PrimeReact components
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Sidebar } from "primereact/sidebar";
import { confirmPopup } from "primereact/confirmpopup";
import { InputSwitch, InputSwitchChangeEvent } from "primereact/inputswitch";

import { useNotification } from '@/layout/context/notificationContext';

import { DepartamentoService, PersonaService } from "@/src/services";
import { Tag } from "primereact/tag";


interface Persona {
    id: number | null;
    departamento_id: number | null;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string
    responsable_departamento:string;
    email: string | null;
    password: string | null;
    password_confirmation: string | null;
    
}
const formularioSchema = Yup.object().shape({

    departamento_id: Yup.number().required('El departamento es obligatorio'),
    nombre: Yup.string().required('El nombre es obligatorio'),
    apellido_paterno: Yup.string().required('El apellido paterno es obligatorio'),
    apellido_materno: Yup.string().required('El apellido materno es obligatorio'),
    responsable_departamento: Yup.string().required('El ¿Es responsable de departamento? es obligatorio'),
    email: Yup.string()
        .nullable()
        .when([], {
            is: (val: string | null) => !!val,
            then: (schema) => schema.email('El email debe ser un email válido'),
            otherwise: (schema) => schema.notRequired(),
        }),
    password: Yup.string()
        .when('email', {
            is: (val: string | null) => !!val,
            then: (schema) => schema
                .min(8, 'La contraseña debe tener al menos 8 caracteres')
                .required('La contraseña es obligatoria'),
            otherwise: (schema) => schema.notRequired(),
        }),
    password_confirmation: Yup.string()
        .when('email', {
            is: (val: string | null) => !!val,
            then: (schema) => schema
                .oneOf([Yup.ref('password'), undefined], 'Las contraseñas deben coincidir')
                .required('La confirmación de contraseña es obligatoria'),
            otherwise: (schema) => schema.notRequired(),
        }),
});

const PersonasPage = () => {

    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingGuardar, setLoadingGuardar] = useState(false);
    const [visibleFormulario, setVisibleFormulario] = useState(false);
    const [deletingRows, setDeletingRows] = useState<{ [key: string]: boolean }>({});
    const [formularioPersona, setFormularioPersona] = useState<any>({
        id: null,
        departamento_id:null,
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        responsable_departamento: false,
        email: '',
        password: '',
        password_confirmation: ''
    });
    const [formularioErrors, setFormularioErrors] = useState<{ [key: string]: string }>({});

    const { showError, showSuccess } = useNotification();
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [globalFilterValue, setGlobalFilterValue] = useState('');

    useEffect(() => {
        setLoading(true);
        DepartamentoService.getListDepartamento()
            .then((response:any) => {
                const departamentos = response.data.map((item:any) => ({
                    id: item.id,
                    nombre: item.nombre,
                }));
                setDepartamentos(departamentos);
            })
            .catch((error:any) => {
                showError(error.message || 'Ha ocurrido un error al obtener la lista de departamentos');
            });

        PersonaService.getListPersona()
            .then((response:any) => {
                setPersonas(response.data);
            })
            .catch((error:any) => {
                showError(error.message || 'Ha ocurrido un error al obtener la lista de personas');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleFormularioChange = (e: any) => {

        const name = e.target?.name ?? e.originalEvent?.target?.name;
        const value = e.value ?? e.target?.value;
        setFormularioPersona((prev:any) => ({
            ...prev,
            [name]: value,
        }));
    };
    
    const handleSaveData = async () => {

        setLoadingGuardar(true);

        try {

            await formularioSchema.validate(formularioPersona, { abortEarly: false });
            setFormularioErrors({});

            const contexto =  {
                ...formularioPersona,
                responsable_departamento: formularioPersona.responsable_departamento ? 'Si' : 'No'
            }
            const response:any = formularioPersona.id
                ? await PersonaService.updatePersona(formularioPersona.id, contexto)
                : await PersonaService.createPersona(contexto);

            const persona = await response.data;

            updateRows(persona);
            showSuccess('El registro se ha guardado correctamente');
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

    const handleEditPersona = (e:any) => {

         setFormularioErrors({});
        const data = e.data;
        setFormularioPersona((_prev:any) => ({
           ...data,
           responsable_departamento: data.responsable_departamento === 'Si',
        }));
    
        setVisibleFormulario(true);
       
    };

    const handleDeletePersona = (event:any, e:any) => {

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
                        await PersonaService.deletePersona(data.id);
                        updateRows(data, true);
                        cleanRowsDeleting(data);
                        showSuccess('El registro se ha eliminado correctamente');

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
        let _filters = { ...filters };
        _filters['global'] = { value: null, matchMode: 'contains' };
        setFilters(_filters);   
    }

    const onAgregar = () => {
        setFormularioPersona({
            id: null,
            departamento_id:null,
            nombre: '',
            apellido_paterno: '',
            apellido_materno: '',
            responsable_departamento: false,
            email: '',
            password: '',
            password_confirmation: ''   
        });
        setVisibleFormulario(true);
    };

    const cleanRowsDeleting = (data:any) => {

        setDeletingRows((prev:any) => {
            const newRowsDeleting = { ...prev };
            delete newRowsDeleting[data.uuid];
            return newRowsDeleting;
        });
    }

    const updateRows = (data:any, isDelete:boolean=false) => {

        setPersonas((prev:any) => {

            let updatedPersonas = [...prev];
            const index = updatedPersonas.findIndex((person) => person.id === data.id);

            if(isDelete) {
                updatedPersonas = updatedPersonas.filter((_persona:any, idx:any) => index !== idx)
            } else {
                if(index !== -1) {
                    updatedPersonas[index] = {
                        ...data,
                    }; 
                } else {
                    updatedPersonas = [...updatedPersonas, data];
                }
                
            }
            return updatedPersonas;
        });
    }
    
    // Custom templates
    const customHeader =(
        <div className="flex justify-content-between align-items-center">
            <h5 className="m-0">{formularioPersona?.id ? 'Actualizar información' : 'Nuevo registro'}</h5>
        </div>
    );
    

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
                    loading={deletingRows[rowData.keyString]}
                    onClick={(event) => customHandlers.onDelete(event,{ data: rowData, index: options.rowIndex })} 
                />
            </div>
    );

    const bodyNombre = (rowData:Persona) => {  
        return (
            <span>
                {rowData.nombre} {rowData.apellido_paterno} {rowData.apellido_materno}
            </span>
        );
    }

    const bodyEsResponsable = (rowData:Persona) => {  
        return (
            <span>
                <Tag style={{ fontSize: '1rem' }} severity={rowData.responsable_departamento ? 'success' : 'danger'}>{rowData.responsable_departamento ? 'Sí' : 'No'}</Tag>
            </span>
        );
    }


    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>Lista de personas</h5>
                    <DataTable
                        value={personas}
                        paginator
                        rows={25}
                        dataKey="id"
                        filters={filters}
                        filterDisplay="menu"
                        loading={loading}
                        emptyMessage="No se encontraron registros."
                        editMode='row'
                        header={renderHeader()}
                    >
                        <Column 
                            body={bodyNombre}
                            header="Nombre" 
                            filter 
                            filterPlaceholder="Busqueda por nombre" 
                            style={{ maxWidth: '4rem' }} />
                        
                        <Column 
                            field="nombre_departamento" 
                            header="Departamento" 
                            filter 
                            filterPlaceholder="Busqueda por departamento" 
                            style={{ maxWidth: '4rem' }} />

                        <Column 
                            body={bodyEsResponsable}
                            bodyClassName="text-center"
                            header="Responsable de departamento" 
                            style={{ maxWidth: '4rem' }} />
                        
                        <Column 
                            body={(rowData, options) => actionsTemplate(rowData, options, {
                                onEdit:handleEditPersona,
                                onDelete:handleDeletePersona
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
                    header={customHeader}>
                    <div className="flex flex-column h-full">
                        <div className='flex flex-column justify-content-between gap-4'>
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="" className='font-medium'>Nombre <span className='text-red-600'>*</span></label>
                                    <InputText  
                                        name="nombre"
                                        value={formularioPersona.nombre}
                                        onChange={handleFormularioChange}></InputText>
                                    {formularioErrors.nombre && (
                                        <small className='text-red-600'>{formularioErrors.nombre}</small>
                                    )}
                                </div>
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="" className='font-medium'>Apellido Paterno <span className='text-red-600'>*</span></label>
                                    <InputText  
                                        name="apellido_paterno"
                                        value={formularioPersona.apellido_paterno}
                                        onChange={handleFormularioChange}></InputText>
                                    {formularioErrors.apellido_paterno && (
                                        <small className='text-red-600'>{formularioErrors.apellido_paterno}</small>
                                    )}
                                </div>
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="" className='font-medium'>Apellido Materno <span className='text-red-600'>*</span></label>
                                    <InputText  
                                        name="apellido_materno"
                                        value={formularioPersona.apellido_materno}
                                        onChange={handleFormularioChange}></InputText>
                                    {formularioErrors.apellido_materno && (
                                        <small className='text-red-600'>{formularioErrors.apellido_materno}</small>
                                    )}
                                </div> 
                                <div className="flex flex-column gap-2">
                                    <label htmlFor="" className='font-medium'>Departamento <span className='text-red-600'>*</span></label>
                                    <Dropdown 
                                                name="departamento_id"
                                                value={formularioPersona.departamento_id}
                                                onChange={handleFormularioChange}
                                                options={departamentos} 
                                                optionLabel="nombre" 
                                                optionValue='id'
                                                placeholder="Seleccione una opción" 
                                                className="w-full"/>
                                    {formularioErrors.departamento_id && (
                                        <small className='text-red-600'>{formularioErrors.departamento_id}</small>
                                    )}
                                </div>
                                <div className="flex flex-row align-items-center gap-2">
                                    <label htmlFor="responsable_departamento" 
                                           className='font-medium'>¿Es responsable de departamento?</label>
                                    <InputSwitch 
                                        inputId="responsable_departamento"
                                        checked={formularioPersona?.responsable_departamento === true }
                                        name="responsable_departamento"
                                        onChange={(e: InputSwitchChangeEvent) => handleFormularioChange(e)} />
                                        <span className='text-red-600'>*</span>
                                    
                                    {formularioErrors.responsable_departamento && (
                                        <small className='text-red-600'>{formularioErrors.responsable_departamento}</small>
                                    )}
                                </div> 
                                
                                {!formularioPersona.id && (
                                    <>
                                        <div className="flex flex-column gap-2">
                                            <label htmlFor="" className='font-medium'>Email</label>
                                            <InputText  
                                                name="email"
                                                value={formularioPersona.email ?? ''}
                                                onChange={handleFormularioChange}></InputText>
                                            {formularioErrors.email && (
                                                <small className='text-red-600'>{formularioErrors.email}</small>
                                            )}
                                        </div>
                                        <div className="flex flex-column gap-2">
                                            <label htmlFor="" className='font-medium'>Contraseña</label>
                                            <InputText  
                                                type="password"
                                                name="password"
                                                value={formularioPersona.password ?? ''}
                                                onChange={handleFormularioChange}></InputText>
                                            {formularioErrors.password && (
                                                <small className='text-red-600'>{formularioErrors.password}</small>
                                            )}
                                        </div> 
                                        <div className="flex flex-column gap-2">
                                            <label htmlFor="" className='font-medium'>Confirmar Contraseña</label>
                                            <InputText  
                                                type="password"
                                                name="password_confirmation"
                                                value={formularioPersona.password_confirmation ?? ''}
                                                onChange={handleFormularioChange}></InputText>
                                            {formularioErrors.password_confirmation && (
                                                <small className='text-red-600'>{formularioErrors.password_confirmation}</small>
                                            )} 
                                        </div>
                                    </>
                                )}
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
}

export default PersonasPage;