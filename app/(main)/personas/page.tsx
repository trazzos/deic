'use client';
import { useEffect } from "react";
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
import { MenuItem } from "primereact/menuitem";
import { Dialog } from "primereact/dialog";
import { Password } from "primereact/password";
import { Tag } from "primereact/tag";
import { MultiSelect } from "primereact/multiselect";

// Components
import PermissionGuard from "@/src/components/PermissionGuard";
import AccessDenied from "@/src/components/AccessDenied";
import { CustomBreadcrumb } from '@/src/components/CustomBreadcrumb';

// Services, Hooks, Contexts, Types
import { useNotification } from '@/layout/context/notificationContext';
import { DepartamentoService, PersonaService, RoleService } from "@/src/services";
import { useFormErrorHandler } from '@/src/utils/errorUtils';
import { Persona, Usuario } from '@/types';
import { usePermissions } from "@/src/hooks/usePermissions";

const formularioSchema = Yup.object().shape({
    departamento_id: Yup.number().required('El departamento es obligatorio'),
    nombre: Yup.string().required('El nombre es obligatorio'),
    apellido_paterno: Yup.string().required('El apellido paterno es obligatorio'),
    apellido_materno: Yup.string().required('El apellido materno es obligatorio'),
    responsable_departamento: Yup.string().required('El ¿Es responsable de departamento? es obligatorio'),
    email: Yup.string()
        .nullable()
        .when('$isExistingPersona', {
            is: true, // Si es una persona existente
            then: (schema) => schema.notRequired(),
            otherwise: (schema) => schema
                .when([], {
                    is: (val: string | null) => !!val,
                    then: (schema) => schema.email('El email debe ser un email válido'),
                    otherwise: (schema) => schema.notRequired(),
                }),
        }),
    password: Yup.string()
        .when('$isExistingPersona', {
            is: true, // Si es una persona existente
            then: (schema) => schema.notRequired(),
            otherwise: (schema) => schema
                .when('email', {
                    is: (val: string | null) => !!val,
                    then: (schema) => schema
                        .min(8, 'La contraseña debe tener al menos 8 caracteres')
                        .required('La contraseña es obligatoria'),
                    otherwise: (schema) => schema.notRequired(),
                }),
        }),
    password_confirmation: Yup.string()
        .when('$isExistingPersona', {
            is: true, // Si es una persona existente
            then: (schema) => schema.notRequired(),
            otherwise: (schema) => schema
                .when('email', {
                    is: (val: string | null) => !!val,
                    then: (schema) => schema
                        .oneOf([Yup.ref('password'), undefined], 'Las contraseñas deben coincidir')
                        .required('La confirmación de contraseña es obligatoria'),
                    otherwise: (schema) => schema.notRequired(),
                }),
        }),
});

const usuarioSchema = Yup.object().shape({
    email: Yup.string()
        .email('El email debe ser un email válido')
        .required('El email es obligatorio'),
    roles: Yup.array().of(Yup.string()).required('Seleccione al menos un rol'),    
    password: Yup.string()
        .when('$isExistingUser', {
            is: false, // Si es un usuario nuevo
            then: (schema) => schema
                .min(8, 'La contraseña debe tener al menos 8 caracteres')
                .required('La contraseña es obligatoria'),
            otherwise: (schema) => schema
                .min(8, 'La contraseña debe tener al menos 8 caracteres')
                .notRequired(), // Para usuarios existentes, la contraseña es opcional
        }),
    password_confirmation: Yup.string()
        .when('password', {
            is: (val: string) => !!val && val.length > 0,
            then: (schema) => schema
                .oneOf([Yup.ref('password'), undefined], 'Las contraseñas deben coincidir')
                .required('La confirmación de contraseña es obligatoria'),
            otherwise: (schema) => schema.notRequired(),
        }),
});

const PersonasPage = () => {

    const { isSuperAdmin, canUpdate, canDelete, hasPermission } = usePermissions();
    const accessEdit = isSuperAdmin || canUpdate('gestion_cuentas.personas');
    const accessDelete = isSuperAdmin || canDelete('gestion_cuentas.personas');
    const accessAdminCuenta = isSuperAdmin || hasPermission('gestion_cuentas.personas.administrar_cuenta');

    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingGuardar, setLoadingGuardar] = useState(false);
    const [visibleFormulario, setVisibleFormulario] = useState(false);
    const [deletingRows, setDeletingRows] = useState<{ [key: string]: boolean }>({});
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
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

    // Filtros personalizados
    const [filtroUsuario, setFiltroUsuario] = useState<string | null>(null);
    const [filtroDepartamento, setFiltroDepartamento] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [visibleUsuarioDialog, setVisibleUsuarioDialog] = useState(false);
    const [selectedPersonaForUser, setSelectedPersonaForUser] = useState<Persona | null>(null);
    const [loadingUsuario, setLoadingUsuario] = useState(false);
    const [usuarioData, setUsuarioData] = useState<Usuario>({
        email: '',
        roles:null,
        password: '',
        password_confirmation: '',
    });
    const [usuarioErrors, setUsuarioErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        setLoading(true);
        RoleService.getListRolesSinPermiso()
            .then((response:any) => {
                const roles = response.data;
                setRoles(roles);
            })
            .catch((error:any) => {
                showError(error.message || 'Ha ocurrido un error al obtener la lista de roles');
            });
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
    
    // Hook personalizado para manejar errores de formulario principal
    const handleFormErrors = useFormErrorHandler(setFormularioErrors, showError);

    const handleSaveData = async () => {
        setLoadingGuardar(true);

        try {
            const isExistingPersona = !!selectedPersona?.id;
            await formularioSchema.validate(formularioPersona, { 
                abortEarly: false,
                context: { isExistingPersona }
            });
            setFormularioErrors({});

            const contexto = {
                ...formularioPersona,
                responsable_departamento: formularioPersona.responsable_departamento ? 'Si' : 'No'
            }
            
            const response: any = formularioPersona.id
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
            } else {
              
                handleFormErrors(err);
            }
        } finally {
            setLoadingGuardar(false);
        };
    };

    const handleEditPersona = (e:any) => {

        setFormularioErrors({});
        const data = e.data;
        setSelectedPersona(data);
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
        <div className="flex align-items-center gap-2 py-2">
            <i className={formularioPersona?.id ? 'pi pi-user-edit text-xl text-primary-600' : 'pi pi-user-plus text-xl text-primary-600'}></i>
            <h5 className="m-0 text-xl font-semibold text-primary-800">
                {formularioPersona?.id ? 'Actualizar información' : 'Nuevo registro'}
            </h5>
        </div>
    );

    const renderToolbar = () => {
        return (
            <div className="mb-4 p-3 bg-white border-round-lg shadow-1 border-1 surface-border">
                <div className="flex justify-content-between align-items-center mb-3">
                    <div className="flex gap-2 align-items-center">
                        <Button
                            type="button"
                            icon={showFilters ? "pi pi-eye-slash" : "pi pi-filter"}
                            label={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                            outlined
                            onClick={() => setShowFilters(!showFilters)}
                        />
                        <span className="text-500 text-sm ml-2">
                            {personasFiltradas.length} registro(s) encontrado(s)
                        </span>
                    </div>
                    <Button
                        type="button"
                        icon="pi pi-plus"
                        label="Agregar"
                        onClick={onAgregar}
                    />
                </div>
                
                {showFilters && (
                    <div className="flex flex-column md:flex-row gap-3 p-3 bg-gray-50 border-round">
                        <div className="flex flex-auto gap-2">
                            <span className="p-input-icon-left">
                                <i className="pi pi-search" />
                                <InputText 
                                    value={globalFilterValue} 
                                    onChange={onGlobalFilterChange} 
                                    placeholder="Buscar por nombre" 
                                    className="w-full"
                                />
                            </span>
                            <Dropdown
                                value={filtroDepartamento}
                                options={[{ label: 'Todos los departamentos', value: null }, ...departamentos.map(d => ({ label: d.nombre, value: d.id }))]}
                                onChange={e => setFiltroDepartamento(e.value)}
                                placeholder="Departamento"
                                className="w-14rem"
                            />
                            <Dropdown
                                value={filtroUsuario}
                                options={[
                                    { label: '¿Cuenta de usuario?', value: null },
                                    { label: 'Sí', value: 'si' },
                                    { label: 'No', value: 'no' },
                                ]}
                                onChange={e => setFiltroUsuario(e.value)}
                                placeholder="¿Cuenta de usuario?"
                                className="w-12rem"
                            />
                        </div>
                        <Button 
                            type="button" 
                            icon="pi pi-filter-slash" 
                            label="Limpiar" 
                            outlined 
                            onClick={clearFilter}
                            className="w-auto"
                        />
                    </div>
                )}
            </div>
        );
    };

    // Filtro aplicado a la tabla
    const personasFiltradas = personas.filter((p) => {
        const nombreCompleto = `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno}`.toLowerCase();
        const nombreMatch = globalFilterValue ? nombreCompleto.includes(globalFilterValue.toLowerCase()) : true;
        const depMatch = filtroDepartamento ? p.departamento_id === filtroDepartamento : true;
        const usuarioMatch = filtroUsuario === 'si' ? !!p.email : filtroUsuario === 'no' ? !p.email : true;
        return nombreMatch && depMatch && usuarioMatch;
    });

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
                <Tag style={{ fontSize: '1rem' }} severity={rowData.responsable_departamento === 'Si' ? 'success' : 'danger'}>{rowData.responsable_departamento}</Tag>
            </span>
        );
    }

    // Hook personalizado para manejar errores de usuario
    const handleUsuarioErrors = useFormErrorHandler(setUsuarioErrors, showError);

    const bodyCuentaUsuario = (rowData: Persona) => {
        const tieneCuenta = !!rowData?.email && rowData.cuenta_activa;
        return (
            <Tag
                value={tieneCuenta ? 'Sí' : 'No'}
                severity={tieneCuenta ? 'success' : undefined}
                className={tieneCuenta ? '' : 'surface-200 text-900 border-none'}
                style={{ fontSize: '1rem', minWidth: 32, textAlign: 'center' }}
            />
        );
    };

    const handleConfigurarUsuario = async (rowData: Persona) => {
        const row = { ...rowData };
        let usuario = null;

        if (rowData.id && rowData.email) {

            try {
                const response = await PersonaService.infoCuentaPersona(rowData.id);
                usuario = await response.data;
                row.cuenta_activa = usuario?.active ?? false;
            } catch (error) {
                console.warn('Error al cargar datos del usuario:', error);
            }

        }
        setSelectedPersonaForUser(row);
        setUsuarioData({
            email: usuario?.email || rowData.email || '',
            password: null,
            roles: usuario ? usuario.roles : [],
            password_confirmation: null,
        });
        setUsuarioErrors({});
        setVisibleUsuarioDialog(true);
    };

    const handleUsuarioChange = (e: any) => {
        const name = e.target?.name ?? e.originalEvent?.target?.name;
        const value = e.value ?? e.target?.value ?? e.target?.checked;
        setUsuarioData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveUsuario = async () => {
        if (!selectedPersonaForUser) return;

        setLoadingUsuario(true);
        try {
            // Determinar si es un usuario existente
            const isExistingUser = !!selectedPersonaForUser.email;
            
            // Validar con el contexto apropiado
            await usuarioSchema.validate(usuarioData, { 
                abortEarly: false,
                context: { isExistingUser }
            });
            
            setUsuarioErrors({});

            // Preparar los datos para enviar
            const dataToSend = {
                email: usuarioData.email,
                roles: usuarioData.roles,
                ...(usuarioData.password && { password: usuarioData.password }),
                ...(usuarioData.password_confirmation && { password_confirmation: usuarioData.password_confirmation })
            };

            await PersonaService.actualizarCuenta(selectedPersonaForUser.id, dataToSend);
            
            // Actualizar la persona en la tabla
            const updatedPersona = { 
                ...selectedPersonaForUser, 
                email: usuarioData.email,
                cuenta_activa: true
            };
            updateRows(updatedPersona);
            
            showSuccess(`Usuario ${isExistingUser ? 'actualizado' : 'creado'} correctamente`);
            setVisibleUsuarioDialog(false);
        } catch (err: any) {

               if (err.inner) {
                const errors: { [key: string]: string } = {};
                err.inner.forEach((validationError: any) => {
                    if (validationError.path) {
                        errors[validationError.path] = validationError.message;
                        }
                    });
                    setFormularioErrors(errors);
                } else {
                    handleUsuarioErrors(err);
                }

        } finally {
            setLoadingUsuario(false);
        }
    };

    const handleDisableUsuario = async () => {
        if (!selectedPersonaForUser) return;

        confirmPopup({
            target: document.activeElement as HTMLElement,
            message: '¿Está seguro de inhabilitar el acceso de usuario?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, inhabilitar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    setLoadingUsuario(true);
                    await PersonaService.disableCuenta(selectedPersonaForUser.id);

                    // Simular eliminación
                    const updatedPersona = { 
                        ...selectedPersonaForUser, 
                        cuenta_activa: selectedPersonaForUser.cuenta_activa ? false : true, 
                    };
                    setSelectedPersonaForUser(updatedPersona);
                    updateRows(updatedPersona);

                    showSuccess('Acceso de usuario inhabilitado correctamente');
                    //setVisibleUsuarioDialog(false);
                } catch (error: any) {
                    showError(error.message || 'Error al inhabilitar el acceso de usuario');
                } finally {
                    setLoadingUsuario(false);
                }
            }
        });
    };

    // Breadcrumb items
    const breadcrumbItems: MenuItem[] = [
        { label: 'Gestión de cuentas', icon: 'pi pi-briefcase' },
        { label: 'Personas', icon: 'pi pi-user-edit' }
    ];
    
    const actionsTemplate = (rowData:any, options:any, customHandlers:any) => {
        const tieneCuenta = !!rowData.email;
        return (
            <div className="flex align-items-center justify-content-center gap-2">

               {accessEdit && (
                    <Button
                        icon="pi pi-pencil"
                        size='small'
                        onClick={() => customHandlers.onEdit({ data: rowData, index: options.rowIndex })}
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
               { accessAdminCuenta && (
                     <Button
                        icon="pi pi-user"
                        size="small"
                        severity={tieneCuenta ? 'success' : undefined}
                        className={tieneCuenta ? '' : 'surface-200 text-900 border-none'}
                        tooltip="Configurar usuario"
                        tooltipOptions={{ position: 'top' }}
                        onClick={() => handleConfigurarUsuario(rowData)}
                    />
               )} 
            </div>
        );
    };

    return (
        <PermissionGuard
            resource='gestion_cuentas'
            action='personas'
            fallback={<AccessDenied variant="detailed" message="No tienes acceso a esta modulo"/>}
            >
            <div className="grid">
                <div className="col-12">
                    <CustomBreadcrumb
                        items={breadcrumbItems}
                        theme="green"
                        title="Gestión de Personas"
                        description="Administra la información del personal y usuarios"
                        icon="pi pi-users"
                    />
                    {renderToolbar()}
                    <div className="bg-white border border-gray-200 overflow-hidden border-round-xl shadow-2">
                        <DataTable
                            value={personasFiltradas}
                            paginator
                            rows={25}
                            dataKey="id"
                            loading={loading}
                            emptyMessage="No se encontraron registros."
                            editMode='row'
                            className="p-datatable-sm border-none shadow-none"
                            style={{ borderRadius: '1rem' }}
                        >
                            <Column
                                body={bodyNombre}
                                header="Nombre"
                                filter
                                filterPlaceholder="Buscar por nombre"
                                style={{ minWidth: '10rem' }}
                            />
                            <Column
                                field="nombre_departamento"
                                header="Departamento"
                                filter
                                filterPlaceholder="Buscar por departamento"
                                style={{ minWidth: '8rem' }}
                            />
                            <Column
                                body={bodyEsResponsable}
                                bodyClassName="text-center"
                                header="Responsable de departamento"
                                style={{ minWidth: '8rem' }}
                            />
                            <Column
                                body={bodyCuentaUsuario}
                                bodyClassName="text-center"
                                header="Cuenta de usuario"
                                style={{ minWidth: '8rem' }}
                            />
                            <Column
                                body={(rowData, options) => actionsTemplate(rowData, options, {
                                    onEdit: handleEditPersona,
                                    onDelete: handleDeletePersona,
                                })}
                                bodyClassName="text-center"
                                style={{ minWidth: '7rem' }}
                            />
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
                        pt={{
                            header: { className: 'border-bottom-1 surface-border' },
                            content: { className: 'p-0' }
                        }}
                        header={customHeader}>
                        <div className="flex flex-column h-full">
                            <div className="p-4 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
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
                            </div>
                            <div className="mt-auto border-top-1 surface-border p-4">
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

                    {/* Dialog para configurar usuario */}
                    <Dialog
                        visible={visibleUsuarioDialog}
                        onHide={() => setVisibleUsuarioDialog(false)}
                        header={
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-user text-blue-600"></i>
                                <span className="font-bold text-blue-800">
                                    {selectedPersonaForUser?.email ? 'Editar Usuario' : 'Crear Usuario'}
                                </span>
                            </div>
                        }
                        modal
                        style={{ width: '450px' }}
                        className="p-dialog-header-icons-only"
                        dismissableMask
                    >
                        <div className="mb-4 p-3 bg-blue-50 border-round border-1 border-blue-100">
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-info-circle text-blue-600"></i>
                                <div>
                                    <div className="font-medium text-blue-800">
                                        {selectedPersonaForUser?.nombre} {selectedPersonaForUser?.apellido_paterno} {selectedPersonaForUser?.apellido_materno}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                        {selectedPersonaForUser?.email ? 'Modificar credenciales de acceso' : 'Crear nueva cuenta de usuario'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-column gap-4">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="email" className="font-medium text-900">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="email"
                                    name="email"
                                    value={usuarioData.email ?? ''}
                                    onChange={handleUsuarioChange}
                                    placeholder="usuario@ejemplo.com"
                                    className={usuarioErrors.email ? 'p-invalid' : ''}
                                />
                                {usuarioErrors.email && (
                                    <small className="text-red-500">{usuarioErrors.email}</small>
                                )}
                            </div>
                            <div className="flex flex-column gap-2">
                                <label htmlFor="roles" className="font-medium text-900">
                                    Roles de acceso <span className="text-red-500">*</span>
                                </label>
                                <MultiSelect
                                    id="roles"
                                    showClear
                                    name="roles"
                                    value={usuarioData.roles}
                                    options={roles}
                                    onChange={handleUsuarioChange}
                                    optionLabel="texto"
                                    optionValue="clave"
                                    placeholder="Seleccione una opción"
                                    className={usuarioErrors.roles ? 'p-invalid' : ''}
                                />
                                {usuarioErrors.roles && (
                                    <small className="text-red-500">{usuarioErrors.roles}</small>
                                )}
                            </div>

                            <div className="flex flex-column gap-2">
                                <label htmlFor="password" className="font-medium text-900">
                                    {selectedPersonaForUser?.email ? 'Nueva Contraseña' : 'Contraseña'} 
                                    <span className="text-red-500">*</span>
                                </label>
                                <Password
                                    id="password"
                                    name="password"
                                    value={usuarioData.password ?? ''}
                                    onChange={handleUsuarioChange}
                                    placeholder="Mínimo 8 caracteres"
                                    toggleMask
                                    feedback={false}
                                    className={usuarioErrors.password ? 'p-invalid' : ''}
                                />
                                {usuarioErrors.password && (
                                    <small className="text-red-500">{usuarioErrors.password}</small>
                                )}
                            </div>

                            <div className="flex flex-column gap-2">
                                <label htmlFor="password_confirmation" className="font-medium text-900">
                                    Confirmar Contraseña <span className="text-red-500">*</span>
                                </label>
                                <Password
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    value={usuarioData.password_confirmation ?? ''}
                                    onChange={handleUsuarioChange}
                                    placeholder="Repetir contraseña"
                                    toggleMask
                                    feedback={false}
                                    className={usuarioErrors.password_confirmation ? 'p-invalid' : ''}
                                />
                                {usuarioErrors.password_confirmation && (
                                    <small className="text-red-500">{usuarioErrors.password_confirmation}</small>
                                )}
                            </div>
                            {selectedPersonaForUser?.email && (
                                <Button
                                    label= { selectedPersonaForUser?.cuenta_activa ? "Inhabilitar Acceso" : "Habilitar Acceso" }
                                    icon={ selectedPersonaForUser?.cuenta_activa ? "pi pi-lock" : "pi pi-lock-open" }
                                    severity={ selectedPersonaForUser?.cuenta_activa ? 'success' : 'danger' }
                                    outlined
                                    onClick={handleDisableUsuario}
                                    disabled={loadingUsuario}
                                    />
                                )}
                        </div>

                        <div className="flex justify-content-between align-items-center mt-6 pt-4 border-top-1 surface-border">
                            { (selectedPersonaForUser?.cuenta_activa || selectedPersonaForUser?.email === null) && (
                                <div className="flex gap-2 ml-auto">
                                    <Button
                                        label="Cancelar"
                                        icon="pi pi-times"
                                        outlined
                                        onClick={() => setVisibleUsuarioDialog(false)}
                                        disabled={loadingUsuario}
                                    />
                                    <Button
                                        label={selectedPersonaForUser?.email ? 'Actualizar' : 'Crear Usuario'}
                                        icon="pi pi-save"
                                        loading={loadingUsuario}
                                        onClick={handleSaveUsuario}
                                    />
                                </div>)}
                        </div>
                    </Dialog>
                </div>
            </div>
        </PermissionGuard>
        
    );
}

export default PersonasPage;