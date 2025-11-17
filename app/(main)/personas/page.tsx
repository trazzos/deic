'use client';
import { useEffect } from "react";
import { useState } from "react";

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
import { FileUpload } from "primereact/fileupload";
import { Avatar } from "primereact/avatar";

// Components
import PermissionGuard from "@/src/components/PermissionGuard";
import AccessDenied from "@/src/components/AccessDenied";
import { CustomBreadcrumb } from '@/src/components/CustomBreadcrumb';

// Services, Hooks, Contexts, Types, Schemas
import { useNotification } from '@/layout/context/notificationContext';
import { DepartamentoService, PersonaService, RoleService, OrganizacionService, UnidadApoyoService } from "@/src/services";
import { useFormErrorHandler } from '@/src/utils/errorUtils';
import { Persona, Usuario } from '@/types/persona';
import { formularioSchema, usuarioSchema } from '@/src/schemas/persona';
import { usePermissions } from "@/src/hooks/usePermissions";

const PersonasPage = () => {

    const { isSuperAdmin, canUpdate, canDelete, hasPermission } = usePermissions();
    const accessEdit = isSuperAdmin || canUpdate('gestion_cuentas.personas');
    const accessDelete = isSuperAdmin || canDelete('gestion_cuentas.personas');
    const accessAdminCuenta = isSuperAdmin || hasPermission('gestion_cuentas.personas.administrar_cuenta');

    const [roles, setRoles] = useState<any[]>([]);
    const [personas, setPersonas] = useState<Persona[]>([]);
    
    // Estados para las dependencias - se cargan una sola vez
    const [secretarias, setSecretarias] = useState<any[]>([]);
    const [todasSubsecretarias, setTodasSubsecretarias] = useState<any[]>([]);
    const [todasDirecciones, setTodasDirecciones] = useState<any[]>([]);
    const [todosDepartamentos, setTodosDepartamentos] = useState<any[]>([]);
    const [todasUnidadesDeApoyo, setTodasUnidadesDeApoyo] = useState<any[]>([]);
    
    // Estados para filtros jerárquicos del lado del cliente
    const [subsecretariasFiltradas, setSubsecretariasFiltradas] = useState<any[]>([]);
    const [direccionesFiltradas, setDireccionesFiltradas] = useState<any[]>([]);
    const [departamentosFiltrados, setDepartamentosFiltrados] = useState<any[]>([]);
    const [unidadesApoyoFiltradas, setUnidadesApoyoFiltradas] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [loadingGuardar, setLoadingGuardar] = useState(false);
    const [visibleFormulario, setVisibleFormulario] = useState(false);
    const [deletingRows, setDeletingRows] = useState<{ [key: string]: boolean }>({});
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
    const [formularioPersona, setFormularioPersona] = useState<any>({
        id: null,
        dependencia_type: null,
        dependencia_id: null,
        secretaria_id: null,
        subsecretaria_id: null,
        direccion_id: null,
        departamento_id: null,
        unidad_apoyo_id: null,
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        responsable_departamento: false,
        email: '',
        password: '',
        password_confirmation: '',
        fotografia: null // Nuevo campo para la fotografía
    });
    const [formularioErrors, setFormularioErrors] = useState<{ [key: string]: string }>({});
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { showError, showSuccess } = useNotification();
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [globalFilterValue, setGlobalFilterValue] = useState('');

    // Filtros personalizados
    const [filtroUsuario, setFiltroUsuario] = useState<string | null>(null);
    const [filtroDependenciaType, setFiltroDependenciaType] = useState<string | null>(null);
    const [filtroSecretaria, setFiltroSecretaria] = useState<number | null>(null);
    const [filtroUnidadApoyo, setFiltroUnidadApoyo] = useState<number | null>(null);
    const [filtroSubsecretaria, setFiltroSubsecretaria] = useState<number | null>(null);
    const [filtroDireccion, setFiltroDireccion] = useState<number | null>(null);
    const [filtroDepartamento, setFiltroDepartamento] = useState<number | null>(null);
    
    // Estados para filtros jerárquicos en busqueda
    const [filtroSubsecretariasFiltradas, setFiltroSubsecretariasFiltradas] = useState<any[]>([]);
    const [filtroDireccionesFiltradas, setFiltroDireccionesFiltradas] = useState<any[]>([]);
    const [filtroDepartamentosFiltrados, setFiltroDepartamentosFiltrados] = useState<any[]>([]);
    const [filtroUnidadesApoyoFiltradas, setFiltroUnidadesApoyoFiltradas] = useState<any[]>([]);
    
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
        const loadInitialData = async () => {
            setLoading(true);
            
            try {
                // Cargar todos los catálogos en paralelo
                const [
                    rolesResponse,
                    departamentosResponse, 
                    secretariasResponse,
                    subsecretariasResponse,
                    direccionesResponse,
                    unidadesApoyoResponse,
                    personasResponse
                ] = await Promise.all([
                    RoleService.getListRolesSinPermiso(),
                    DepartamentoService.getListDepartamento(),
                    OrganizacionService.getSecretarias(),
                    OrganizacionService.getSubsecretarias(), 
                    OrganizacionService.getDirecciones(),
                    UnidadApoyoService.getListUnidadApoyo(),
                    PersonaService.getListPersona()
                ]);

                // Procesar y setear todos los datos
                setRoles(rolesResponse.data);
                setTodosDepartamentos(departamentosResponse.data);
                setSecretarias(secretariasResponse.data);
                setTodasSubsecretarias(subsecretariasResponse.data);
                setTodasDirecciones(direccionesResponse.data);
                setTodasUnidadesDeApoyo(unidadesApoyoResponse.data);
                setPersonas(personasResponse.data);

            } catch (error: any) {
                showError(error.message || 'Ha ocurrido un error al cargar los datos iniciales');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [showError]);

    // Cleanup de URLs del preview cuando cambia la fotografía
    useEffect(() => {
        if (formularioPersona.fotografia) {
            const url = URL.createObjectURL(formularioPersona.fotografia);
            setPreviewUrl(url);
            
            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setPreviewUrl(null);
        }
    }, [formularioPersona.fotografia]);

    const handleFormularioChange = (e: any) => {

        const name = e.target?.name ?? e.originalEvent?.target?.name;
        const value = e.value ?? e.target?.value;

        setFormularioPersona((prev: any) => ({
            ...prev,
            [name]: value
        }));

        // Manejar cambios en dependencia_type para limpiar campos y filtrar datos
        if (name === 'dependencia_type') {
            setFormularioPersona((prev: any) => ({
                ...prev,
                dependencia_type: value,
                dependencia_id: null,
                secretaria_id: null,
                subsecretaria_id: null,
                direccion_id: null,
                departamento_id: null,
                unidad_apoyo_id: null
            }));
            
            // Limpiar listas filtradas
            setSubsecretariasFiltradas([]);
            setDireccionesFiltradas([]);
            setDepartamentosFiltrados([]);
            setUnidadesApoyoFiltradas([]);
        }

        // Manejar cambios en secretaria_id para filtrar subsecretarías del lado del cliente
        if (name === 'secretaria_id') {
            setFormularioPersona((prev: any) => ({
                ...prev,
                secretaria_id: value,
                subsecretaria_id: null,
                direccion_id: null,
                departamento_id: null,
                unidad_apoyo_id: null,
                dependencia_id: prev.dependencia_type === 'Secretaria' ? value : null
            }));

            setDireccionesFiltradas([]);
            setDepartamentosFiltrados([]);

            // Para Unidad de Apoyo, filtrar unidades de apoyo disponibles de la secretaría seleccionada
            if (value && formularioPersona.dependencia_type === 'Unidad de Apoyo') {
                const unidadesApoyoDisponibles = todasUnidadesDeApoyo.filter(u =>
                    u.secretaria?.id === value
                );
                setUnidadesApoyoFiltradas(unidadesApoyoDisponibles);
                setSubsecretariasFiltradas([]);
            } else if (value && ['Subsecretaria', 'Direccion', 'Departamento'].includes(formularioPersona.dependencia_type)) {
                const filtradas = todasSubsecretarias.filter(sub => sub.secretaria?.id === value);
                setSubsecretariasFiltradas(filtradas);
                setUnidadesApoyoFiltradas([]);
            } else {
                setSubsecretariasFiltradas([]);
                setUnidadesApoyoFiltradas([]);
            }
        }

        // Manejar cambios en subsecretaria_id para filtrar direcciones del lado del cliente
        if (name === 'subsecretaria_id') {
            setFormularioPersona((prev: any) => ({
                ...prev,
                subsecretaria_id: value,
                direccion_id: null,
                departamento_id: null,
                dependencia_id: prev.dependencia_type === 'Subsecretaria' ? value : null
            }));
            
            setDepartamentosFiltrados([]);
            
            if (value && ['Direccion', 'Departamento'].includes(formularioPersona.dependencia_type)) {
                const filtradas = todasDirecciones.filter(dir => dir.subsecretaria?.id === value);
                setDireccionesFiltradas(filtradas);
            } else {
                setDireccionesFiltradas([]);
            }
        }

        // Manejar cambios en unidad_apoyo_id para actualizar dependencia_id
        if (name === 'unidad_apoyo_id') {
            setFormularioPersona((prev: any) => ({
                ...prev,
                unidad_apoyo_id: value,
                dependencia_id: prev.dependencia_type === 'Unidad de Apoyo' ? value : null
            }));
        }

        // Manejar cambios en direccion_id para filtrar departamentos del lado del cliente
        if (name === 'direccion_id') {
            setFormularioPersona((prev: any) => ({
                ...prev,
                direccion_id: value,
                departamento_id: null,
                dependencia_id: prev.dependencia_type === 'Direccion' ? value : null
            }));
            
            if (value && formularioPersona.dependencia_type === 'Departamento') {
                const filtrados = todosDepartamentos.filter(dep => dep.direccion?.id === value);
                setDepartamentosFiltrados(filtrados);
            } else {
                setDepartamentosFiltrados([]);
            }
        }

        // Actualizar dependencia_id cuando se selecciona el departamento final
        if (name === 'departamento_id') {
            setFormularioPersona((prev: any) => ({
                ...prev,
                departamento_id: value,
                dependencia_id: prev.dependencia_type === 'Departamento' ? value : null
            }));
        }
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

            // el payload que se envia excluye secretaria_id, subsecretaria_id, direccion_id, departamento_id, en ves de eso envia dependencia_id, dependiendo de que se seleccione en dependencia_type
            const { secretaria_id, subsecretaria_id, direccion_id, departamento_id, fotografia, ...resto } = formularioPersona;
            const contexto = {
                ...resto,
                es_titular: formularioPersona.es_titular ? 'Si' : 'No'
            }

            // Si hay fotografía, usar FormData, sino enviar JSON normal
            let payload: any;

            if (fotografia) {
                // Crear FormData para envío con fotografía
                payload = new FormData();
                Object.keys(contexto).forEach(key => {
                    if (contexto[key] !== null && contexto[key] !== undefined) {
                        payload.append(key, contexto[key].toString());
                    }
                });

                if (formularioPersona.id) {
                    payload.append('_method', 'PATCH'); // Para soporte en update
                }

                payload.append('fotografia', fotografia);
            } else {
                // Envío normal sin fotografía
                payload = contexto;
            }
            
            const response: any = formularioPersona.id
                ? await PersonaService.updatePersona(formularioPersona.id, payload)
                : await PersonaService.createPersona(payload);

            const persona = await response.data;

            updateRows(persona);
            showSuccess('El registro se ha guardado correctamente');
            closeFormulario();

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
           dependencia_type: data.dependencia_type == 'No asignado' ? null : data.dependencia_type,
           secretaria_id:null,
           subsecretaria_id:null,
           direccion_id:null,
           departamento_id:null,
           es_titular: data.es_titular === 'Si',
           fotografia: null // Reset fotografía en edición
        }));
 
        switch(data.dependencia_type) {
            case 'Secretaria':
                setFormularioPersona((prev: any) => ({
                    ...prev,
                    secretaria_id: data.dependencia_id
                }));
                break;
            case 'Unidad de Apoyo':
                // Encontrar la unidad de apoyo a la que pertenece la persona
                const unidadApoyo = todasUnidadesDeApoyo.find(u => u.id === data.dependencia_id);
                
                if (unidadApoyo) {
                    // Filtrar todas las unidades de apoyo de la misma secretaría
                    const unidadesApoyoDisponibles = todasUnidadesDeApoyo.filter(u =>
                        u.secretaria?.id === unidadApoyo.secretaria?.id
                    );
                    setUnidadesApoyoFiltradas(unidadesApoyoDisponibles);

                    setFormularioPersona((prev: any) => ({
                        ...prev,
                        secretaria_id: unidadApoyo.secretaria?.id,
                        unidad_apoyo_id: data.dependencia_id
                    }));
                }
                break;
            case 'Subsecretaria':
                const subsecretaria = todasSubsecretarias.find(sub => sub.id === data.dependencia_id);
                let filtradasSubs = todasSubsecretarias.filter(sub => sub.secretaria?.id === subsecretaria?.secretaria?.id);
                setSubsecretariasFiltradas(filtradasSubs);

                setFormularioPersona((prev: any) => ({
                    ...prev,
                    secretaria_id: subsecretaria?.secretaria?.id || null,
                    subsecretaria_id: data.dependencia_id
                }));

                break;
            case 'Direccion':
                const direccion = todasDirecciones.find(dir => dir.id === data.dependencia_id);
                let filtradasDir = todasDirecciones.filter(dir => dir.subsecretaria?.id === direccion?.subsecretaria?.id);
                setDireccionesFiltradas(filtradasDir);

                setFormularioPersona((prev: any) => ({
                    ...prev,
                    secretaria_id: direccion?.subsecretaria?.secretaria?.id || null,
                    subsecretaria_id: direccion?.subsecretaria?.id || null,
                    direccion_id: data.dependencia_id,
                    
                }));
                break;
            case 'Departamento':
                const departamento = todosDepartamentos.find(dep => dep.id === data.dependencia_id);

                let filtradasDeps = todosDepartamentos.filter(dep => dep.direccion?.id === departamento?.direccion?.id);
                setDepartamentosFiltrados(filtradasDeps);

                let filtradasDirDep = todasDirecciones.filter(dir => dir.subsecretaria?.id === departamento?.direccion?.subsecretaria?.id);
                setDireccionesFiltradas(filtradasDirDep);

                let filtradasSubsDep = todasSubsecretarias.filter(sub => sub.secretaria?.id === departamento?.direccion?.subsecretaria?.secretaria.id);
                setSubsecretariasFiltradas(filtradasSubsDep);

                setFormularioPersona((prev: any) => ({
                    ...prev,
                    secretaria_id: departamento?.direccion?.subsecretaria?.secretaria?.id || null,
                    subsecretaria_id: departamento?.direccion?.subsecretaria?.id || null,
                    direccion_id: departamento?.direccion?.id || null,
                    departamento_id: data.dependencia_id,
                }));
                break;
        }
    
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
        setGlobalFilterValue('');
        
        // Limpiar filtros jerárquicos
        setFiltroUsuario(null);
        setFiltroDependenciaType(null);
        setFiltroSecretaria(null);
        setFiltroUnidadApoyo(null);
        setFiltroSubsecretaria(null);
        setFiltroDireccion(null);
        setFiltroDepartamento(null);
        setFiltroUnidadesApoyoFiltradas([]);
        setFiltroSubsecretariasFiltradas([]);
        setFiltroDireccionesFiltradas([]);
        setFiltroDepartamentosFiltrados([]);
    }

    const closeFormulario = () => {
        // Limpiar URL del preview si existe
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setVisibleFormulario(false);
    };

    const onAgregar = () => {
        setFormularioPersona({
            id: null,
            dependencia_type: null,
            dependencia_id: null,
            secretaria_id: null,
            subsecretaria_id: null,
            direccion_id: null,
            departamento_id: null,
            nombre: '',
            apellido_paterno: '',
            apellido_materno: '',
            es_titular: false,
            email: '',
            password: '',
            password_confirmation: '',
            fotografia: null   
        });
        
        // Limpiar listas jerárquicas filtradas
        setSubsecretariasFiltradas([]);
        setDireccionesFiltradas([]);
        setDepartamentosFiltrados([]);
        
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
            <div className="mb-3 p-3 bg-white border-round-lg shadow-1 border-1 surface-border">
                <div className="flex justify-content-between align-items-center mb-2">
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
                    <div className="flex flex-column gap-3 p-3 border-round">
                        {/* Fila 1: Búsqueda por nombre y tipo de dependencia */}
                        <div className="flex flex-column md:flex-row gap-2">
                            <div className="flex flex-column items-center gap-2">
                                <label htmlFor="">Busqueda por nombre</label>
                                <span className="p-input-icon-left">
                                    <i className="pi pi-search" />
                                    <InputText 
                                        value={globalFilterValue} 
                                        onChange={onGlobalFilterChange} 
                                        placeholder="Buscar por nombre" 
                                        className="w-full"
                                    />
                                </span>
                            </div>
                            <div className="flex flex-column gap-2">
                                <label htmlFor="">Tipo de dependencia</label>
                                 <Dropdown
                                    value={filtroDependenciaType}
                                    showClear
                                    options={[
                                        { label: 'Secretaría', value: 'Secretaria' },
                                        { label: 'Unidad de Apoyo', value: 'Unidad de Apoyo' },
                                        { label: 'Subsecretaría', value: 'Subsecretaria' },
                                        { label: 'Dirección', value: 'Direccion' },
                                        { label: 'Departamento', value: 'Departamento' },
                                    ]}
                                    onChange={e => handleFiltroChange('filtroDependenciaType', e.value)}
                                    placeholder="Seleccione una opción"
                                    className="w-14rem"
                                />
                            </div>
                            <div className="flex flex-column gap-2">
                                <label htmlFor="">¿Cuenta con usuario?</label>
                                <Dropdown
                                    value={filtroUsuario}
                                    showClear
                                    options={[
                                        { label: 'Sí', value: 'si' },
                                        { label: 'No', value: 'no' },
                                    ]}
                                    onChange={e => setFiltroUsuario(e.value)}
                                    placeholder="Seleccione una opción"
                                    className="w-12rem"
                                />
                            </div>
                        </div>

                        {/* Fila 2: Filtros cascada jerárquicos */}
                        <div className="flex flex-column md:flex-row gap-3">
                            <div className="flex flex-auto gap-2">
                                {
                                     ['Secretaria','Unidad de Apoyo','Subsecretaria','Direccion','Departamento'].includes(filtroDependenciaType || '') && (
                                         <Dropdown
                                            showClear
                                            value={filtroSecretaria}
                                            options={[ ...secretarias.map(s => ({ label: s.nombre, value: s.id }))]}
                                            onChange={e => handleFiltroChange('filtroSecretaria', e.value)}
                                            placeholder="Secretaría"
                                            className="w-14rem"
                                            disabled={filtroDependenciaType === null || filtroDependenciaType === '' || filtroDependenciaType === undefined}
                                        />)
                                }

                                {
                                    filtroDependenciaType === 'Unidad de Apoyo' && (
                                        <Dropdown
                                            showClear
                                            value={filtroUnidadApoyo}
                                            options={[ ...filtroUnidadesApoyoFiltradas.map(u => ({
                                                label: `${u.nombre} ${u.apellido_paterno} ${u.apellido_materno}`,
                                                value: u.id
                                            }))]}
                                            onChange={e => handleFiltroChange('filtroUnidadApoyo', e.value)}
                                            placeholder="Seleccione unidad de apoyo"
                                            className="w-14rem"
                                            disabled={!filtroSecretaria || filtroUnidadesApoyoFiltradas.length === 0}
                                        />)
                                }

                                {
                                    ['Subsecretaria','Direccion','Departamento'].includes(filtroDependenciaType || '') && (
                                        <Dropdown
                                            showClear
                                            value={filtroSubsecretaria}
                                            options={[ ...filtroSubsecretariasFiltradas.map(s => ({ label: s.nombre, value: s.id }))]}
                                            onChange={e => handleFiltroChange('filtroSubsecretaria', e.value)}
                                            placeholder="Seleccione subsecretaría"
                                            className="w-14rem"
                                            disabled={!filtroSecretaria} />
                                    )
                                }
                                {
                                   ['Direccion','Departamento'].includes(filtroDependenciaType || '') && (
                                       <Dropdown
                                            showClear
                                            value={filtroDireccion}
                                            options={[...filtroDireccionesFiltradas.map(d => ({ label: d.nombre, value: d.id }))]}
                                            onChange={e => handleFiltroChange('filtroDireccion', e.value)}
                                            placeholder="Seleccione dirección"
                                            className="w-14rem"
                                            disabled={!filtroSubsecretaria}/>
                                    ) 
                                }
                                 {
                                   ['Departamento'].includes(filtroDependenciaType || '') && (
                                         <Dropdown
                                            showClear
                                            value={filtroDepartamento}
                                            options={[ ...filtroDepartamentosFiltrados.map(d => ({ label: d.nombre, value: d.id }))]}
                                            onChange={e => handleFiltroChange('filtroDepartamento', e.value)}
                                            placeholder="Seleccione departamento"
                                            className="w-14rem"
                                            disabled={!filtroDireccion}/>
                                    ) 
                                }
                            </div>
                        </div>

                        {/* Fila 3: Otros filtros */}
                        <div className="flex flex-column md:flex-row justify-content-start md:justify-content-end">
                            <Button 
                                type="button" 
                                icon="pi pi-filter-slash" 
                                label="Limpiar filtros" 
                                outlined 
                                onClick={clearFilter}
                                className="w-auto"
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Función para manejar cambios en filtros jerárquicos
    const handleFiltroChange = (name: string, value: any) => {
        if (name === 'filtroDependenciaType') {
            setFiltroDependenciaType(value === undefined ? null : value);
            setFiltroSecretaria(null);
            setFiltroUnidadApoyo(null);
            setFiltroSubsecretaria(null);
            setFiltroDireccion(null);
            setFiltroDepartamento(null);
            setFiltroUnidadesApoyoFiltradas([]);
            setFiltroSubsecretariasFiltradas([]);
            setFiltroDireccionesFiltradas([]);
            setFiltroDepartamentosFiltrados([]);
        } else if (name === 'filtroSecretaria') {
            setFiltroSecretaria(value === undefined ? null : value);
            setFiltroUnidadApoyo(null);
            setFiltroSubsecretaria(null);
            setFiltroDireccion(null);
            setFiltroDepartamento(null);
            setFiltroDireccionesFiltradas([]);
            setFiltroDepartamentosFiltrados([]);

            // Para Unidad de Apoyo, filtrar unidades de apoyo de la secretaría seleccionada
            if (value && filtroDependenciaType && filtroDependenciaType === 'Unidad de Apoyo') {
                const unidadesApoyoFiltradas = todasUnidadesDeApoyo.filter(u =>
                    u.secretaria_id === value
                );
                setFiltroUnidadesApoyoFiltradas(unidadesApoyoFiltradas);
            } else if (value && filtroDependenciaType && ['Subsecretaria', 'Direccion', 'Departamento'].includes(filtroDependenciaType)) {
                const filtradas = todasSubsecretarias.filter(sub => sub.secretaria?.id === value);
                setFiltroSubsecretariasFiltradas(filtradas);
            } else {
                setFiltroSubsecretariasFiltradas([]);
                setFiltroUnidadesApoyoFiltradas([]);
            }
        } else if (name === 'filtroUnidadApoyo') {
            setFiltroUnidadApoyo(value === undefined ? null : value);
        } else if (name === 'filtroSubsecretaria') {
            setFiltroSubsecretaria(value === undefined ? null : value);
            setFiltroDireccion(null);
            setFiltroDepartamento(null);
            setFiltroDepartamentosFiltrados([]);
            
            if (value && filtroDependenciaType && ['Direccion', 'Departamento'].includes(filtroDependenciaType)) {
                const filtradas = todasDirecciones.filter(dir => dir.subsecretaria?.id === value);
                setFiltroDireccionesFiltradas(filtradas);
            } else {
                setFiltroDireccionesFiltradas([]);
            }
        } else if (name === 'filtroDireccion') {
            setFiltroDireccion(value === undefined ? null : value);
            setFiltroDepartamento(null);
            
            if (value && filtroDependenciaType === 'Departamento') {
                const filtrados = todosDepartamentos.filter(dep => dep.direccion?.id === value);
                setFiltroDepartamentosFiltrados(filtrados);
            } else {
                setFiltroDepartamentosFiltrados([]);
            }
        } else if (name === 'filtroDepartamento') {
            setFiltroDepartamento(value === undefined ? null : value);
        }
    };

    // Filtro aplicado a la tabla
    const personasFiltradas = personas.filter((p) => {
        const nombreCompleto = `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno}`.toLowerCase();
        const nombreMatch = globalFilterValue ? nombreCompleto.includes(globalFilterValue.toLowerCase()) : true;
        const usuarioMatch = filtroUsuario === 'si' ? !!p.email : filtroUsuario === 'no' ? !p.email : true;
        
        // Filtro por tipo de dependencia
        const tipoMatch = filtroDependenciaType ? p.dependencia_type === filtroDependenciaType : true;
        
        // Filtro por dependencia específica según el tipo seleccionado
        let dependenciaMatch = true;
        if (filtroDependenciaType === 'Secretaria' && filtroSecretaria) {
            dependenciaMatch = p.dependencia_id === filtroSecretaria;
        } else if (filtroDependenciaType === 'Unidad de Apoyo' && filtroUnidadApoyo) {
            dependenciaMatch = p.id === filtroUnidadApoyo;
        } else if (filtroDependenciaType === 'Subsecretaria' && filtroSubsecretaria) {
            dependenciaMatch = p.dependencia_id === filtroSubsecretaria;
        } else if (filtroDependenciaType === 'Direccion' && filtroDireccion) {
            dependenciaMatch = p.dependencia_id === filtroDireccion;
        } else if (filtroDependenciaType === 'Departamento' && filtroDepartamento) {
            dependenciaMatch = p.dependencia_id === filtroDepartamento;
        }
        
        return nombreMatch && usuarioMatch && tipoMatch && dependenciaMatch;
    });

    const bodyNombre = (rowData:Persona) => {  
        // Generar iniciales del nombre completo
        const iniciales = `${rowData.nombre?.charAt(0) || ''}${rowData.apellido_paterno?.charAt(0) || ''}`.toUpperCase();
        
        return (
            <div className="flex align-items-center gap-2">
                <Avatar 
                    image={rowData.public_url_fotografia || undefined}
                    label={!rowData.public_url_fotografia ? iniciales : undefined}
                    size="normal"
                    shape="circle"
                    className="flex-shrink-0"
                    style={{ 
                        backgroundColor: !rowData.public_url_fotografia ? '#6366f1' : undefined,
                        color: !rowData.public_url_fotografia ? 'white' : undefined,
                        width: '32px',
                        height: '32px'
                    }}
                />
                <span className="font-medium">
                    {rowData.nombre} {rowData.apellido_paterno} {rowData.apellido_materno}
                </span>
            </div>
        );
    }

    const bodyEsTitular = (rowData:Persona) => {  
        return (
            <span>
                <Tag style={{ fontSize: '.875rem' }} severity={rowData.es_titular === 'Si' ? 'success' : 'danger'}>{rowData.es_titular ?? 'No'}</Tag>
            </span>
        );
    }

    const bodyDependencia = (rowData:Persona) => {  
        return (    
            <div className="flex flex-column items-align-center gap-2">
                <div className="flex flex-1 gap-2">
                    <span className="text-surface-200 font-bold text-sm">Tipo:</span>
                    <span className="text-surface-600 text-sm">{rowData.dependencia_type}</span>
                </div>
                {['Secretaria', 'Unidad de Apoyo', 'Subsecretaria', 'Direccion', 'Departamento'].includes(rowData.dependencia_type ?? '') && (
                    <div className="flex flex-1 gap-1">
                        <span className="text-surface-200 font-bold text-sm">Nombre:</span>
                        <span className="text-surface-600 text-sm">{rowData.nombre_dependencia}</span>
                    </div>
                )}
            </div>
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
                style={{ fontSize: '.875rem', minWidth: 24, textAlign: 'center' }}
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
                                field="dependencia"
                                header="Dependencia"
                                body={bodyDependencia}
                                style={{ minWidth: '8rem' }}
                            />
                            <Column
                                body={bodyEsTitular}
                                bodyClassName="text-center"
                                header="Es titular"
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
                        onHide={() => closeFormulario()} 
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
                                        <label htmlFor="" className='font-medium'>Tipo de Dependencia <span className='text-red-600'>*</span></label>
                                        <Dropdown
                                            name="dependencia_type"
                                            showClear
                                            value={formularioPersona.dependencia_type}
                                            options={[
                                                { label: 'Secretaria', value: 'Secretaria' },
                                                { label: 'Unidad de Apoyo', value: 'Unidad de Apoyo' },
                                                { label: 'Subsecretaria', value: 'Subsecretaria' },
                                                { label: 'Direccion', value: 'Direccion' },
                                                { label: 'Departamento', value: 'Departamento' }
                                            ]}
                                            onChange={handleFormularioChange}
                                            placeholder="Seleccione tipo de dependencia"
                                        />
                                        {formularioErrors.dependencia_type && (
                                            <small className='text-red-600'>{formularioErrors.dependencia_type}</small>
                                        )}
                                    </div>

                                    {/* Secretaría - Siempre visible si hay tipo seleccionado */}
                                    {formularioPersona.dependencia_type && (
                                        <div className="flex flex-column gap-2">
                                            <label htmlFor="" className='font-medium'>
                                                Secretaría 
                                                {(formularioPersona.dependencia_type === 'Secretaria') && <span className='text-red-600'>*</span>}
                                            </label>
                                            <Dropdown
                                                name="secretaria_id"
                                                showClear
                                                value={formularioPersona.secretaria_id}
                                                options={secretarias.map(s => ({ label: s.nombre, value: s.id }))}
                                                onChange={handleFormularioChange}
                                                placeholder="Seleccione secretaría"
                                            />
                                            {formularioErrors.secretaria_id && (
                                                <small className='text-red-600'>{formularioErrors.secretaria_id}</small>
                                            )}
                                        </div>
                                    )}

                                    {/* Unidad de Apoyo - Visible solo si tipo es Unidad de Apoyo */}
                                    {formularioPersona.dependencia_type === 'Unidad de Apoyo' && (
                                        <div className="flex flex-column gap-2">
                                            <label htmlFor="" className='font-medium'>
                                                Unidad de Apoyo <span className='text-red-600'>*</span>
                                            </label>
                                            <Dropdown
                                                name="unidad_apoyo_id"
                                                value={formularioPersona.unidad_apoyo_id}
                                                options={unidadesApoyoFiltradas.map((u: any) => ({ 
                                                    label: `${u.nombre} ${u.apellido_paterno} ${u.apellido_materno || ''}`.trim(), 
                                                    value: u.id 
                                                }))}
                                                onChange={handleFormularioChange}
                                                placeholder="Seleccione unidad de apoyo"
                                                disabled={!formularioPersona.secretaria_id || unidadesApoyoFiltradas.length === 0}
                                                className={!formularioPersona.secretaria_id ? 'surface-100' : ''}
                                            />
                                            {formularioErrors.unidad_apoyo_id && (
                                                <small className='text-red-600'>{formularioErrors.unidad_apoyo_id}</small>
                                            )}
                                        </div>
                                    )}

                                    {/* Subsecretaría - Visible si tipo es Subsecretaria, Direccion o Departamento (NO para Unidad de Apoyo) */}
                                    {formularioPersona.dependencia_type && ['Subsecretaria', 'Direccion', 'Departamento'].includes(formularioPersona.dependencia_type) && (
                                        <div className="flex flex-column gap-2">
                                            <label htmlFor="" className='font-medium'>
                                                Subsecretaría
                                                {formularioPersona.dependencia_type === 'Subsecretaria' && <span className='text-red-600'>*</span>}
                                            </label>
                                            <Dropdown
                                                name="subsecretaria_id"
                                                value={formularioPersona.subsecretaria_id}
                                                options={subsecretariasFiltradas.map((s: any) => ({ label: s.nombre, value: s.id }))}
                                                onChange={handleFormularioChange}
                                                placeholder="Seleccione subsecretaría"
                                                disabled={!formularioPersona.secretaria_id || subsecretariasFiltradas.length === 0}
                                                className={!formularioPersona.secretaria_id ? 'surface-100' : ''}
                                            />
                                            {formularioErrors.subsecretaria_id && (
                                                <small className='text-red-600'>{formularioErrors.subsecretaria_id}</small>
                                            )}
                                        </div>
                                    )}

                                    {/* Dirección - Visible si tipo es Direccion o Departamento */}
                                    {formularioPersona.dependencia_type && ['Direccion', 'Departamento'].includes(formularioPersona.dependencia_type) && (
                                        <div className="flex flex-column gap-2">
                                            <label htmlFor="" className='font-medium'>
                                                Dirección 
                                                {formularioPersona.dependencia_type === 'Direccion' && <span className='text-red-600'>*</span>}
                                            </label>
                                            <Dropdown
                                                name="direccion_id"
                                                value={formularioPersona.direccion_id}
                                                options={direccionesFiltradas.map((d: any) => ({ label: d.nombre, value: d.id }))}
                                                onChange={handleFormularioChange}
                                                placeholder="Seleccione dirección"
                                                disabled={!formularioPersona.subsecretaria_id || direccionesFiltradas.length === 0}
                                                className={!formularioPersona.subsecretaria_id ? 'surface-100' : ''}
                                            />
                                            {formularioErrors.direccion_id && (
                                                <small className='text-red-600'>{formularioErrors.direccion_id}</small>
                                            )}
                                        </div>
                                    )}

                                    {/* Departamento - Visible solo si tipo es Departamento */}
                                    {formularioPersona.dependencia_type === 'Departamento' && (
                                        <div className="flex flex-column gap-2">
                                            <label htmlFor="" className='font-medium'>
                                                Departamento <span className='text-red-600'>*</span>
                                            </label>
                                            <Dropdown
                                                name="departamento_id"
                                                value={formularioPersona.departamento_id}
                                                options={departamentosFiltrados.map((d: any) => ({ label: d.nombre, value: d.id }))}
                                                onChange={handleFormularioChange}
                                                placeholder="Seleccione departamento"
                                                disabled={!formularioPersona.direccion_id || departamentosFiltrados.length === 0}
                                                className={!formularioPersona.direccion_id ? 'surface-100' : ''}
                                            />
                                            {formularioErrors.departamento_id && (
                                                <small className='text-red-600'>{formularioErrors.departamento_id}</small>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-row align-items-center gap-2">
                                        <label htmlFor="es_titular" 
                                            className='font-medium'>¿Es titular?</label>
                                        <InputSwitch 
                                            inputId="es_titular"
                                            checked={formularioPersona?.es_titular === true }
                                            name="es_titular"
                                            onChange={(e: InputSwitchChangeEvent) => handleFormularioChange(e)} />
                                            <span className='text-red-600'>*</span>

                                        {formularioErrors.es_titular && (
                                            <small className='text-red-600'>{formularioErrors.es_titular}</small>
                                        )}
                                    </div> 

                                    {/* Campo de fotografía - Opcional */}
                                    <div className="flex flex-column gap-2">
                                        <label className='font-medium'>Fotografía (Opcional)</label>
                                        
                                        {/* Vista previa del avatar */}
                                        <div className="flex align-items-center gap-3 mb-2">
                                            <Avatar 
                                                image={previewUrl || selectedPersona?.public_url_fotografia || undefined}
                                                label={!previewUrl && !selectedPersona?.public_url_fotografia ? 
                                                    `${formularioPersona.nombre?.charAt(0) || ''}${formularioPersona.apellido_paterno?.charAt(0) || ''}`.toUpperCase() : 
                                                    undefined
                                                }
                                                size="large"
                                                shape="circle"
                                                style={{ 
                                                    backgroundColor: !previewUrl && !selectedPersona?.public_url_fotografia ? '#6366f1' : undefined,
                                                    color: !previewUrl && !selectedPersona?.public_url_fotografia ? 'white' : undefined,
                                                    width: '64px',
                                                    height: '64px'
                                                }}
                                            />
                                            <div className="flex flex-column">
                                                <span className="font-medium">
                                                    {formularioPersona.nombre || 'Nombre'} {formularioPersona.apellido_paterno || 'Apellidos'}
                                                </span>
                                                <small className="text-500">Vista previa</small>
                                            </div>
                                        </div>

                                        <FileUpload
                                            mode="basic"
                                            name="fotografia"
                                            accept="image/*"
                                            maxFileSize={2000000} // 2MB
                                            auto={false}
                                            chooseLabel="Seleccionar foto"
                                            className="p-button-outlined"
                                            customUpload={true}
                                            onSelect={(e) => {
                                                const file = e.files[0];
                                                if (file) {
                                                    setFormularioPersona((prev: any) => ({
                                                        ...prev,
                                                        fotografia: file
                                                    }));
                                                }
                                            }}
                                            onRemove={() => {
                                                setFormularioPersona((prev: any) => ({
                                                    ...prev,
                                                    fotografia: null
                                                }));
                                            }}
                                            onClear={() => {
                                                setFormularioPersona((prev: any) => ({
                                                    ...prev,
                                                    fotografia: null
                                                }));
                                            }}
                                        />
                                        {formularioPersona.fotografia && (
                                            <div className="flex align-items-center gap-2 mt-2">
                                                <i className="pi pi-check-circle text-green-600"></i>
                                                <small className="text-green-600">
                                                    Nueva foto seleccionada: {formularioPersona.fotografia.name}
                                                </small>
                                            </div>
                                        )}
                                        {selectedPersona?.public_url_fotografia && !formularioPersona.fotografia && (
                                            <div className="flex align-items-center gap-2 mt-2">
                                                <i className="pi pi-image text-blue-600"></i>
                                                <small className="text-blue-600">
                                                    Foto actual del sistema
                                                </small>
                                            </div>
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
                                            onClick={() => closeFormulario()}>
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