'use client';
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import * as Yup from 'yup';
import Link from "next/link";

import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { confirmPopup } from 'primereact/confirmpopup';
import { InputText } from 'primereact/inputtext';

import { 
    ProyectoService, 
    TipoActividadService, 
    PersonaService, 
    BeneficiarioService,
    AutoridadService,
    CapacitadorService,
} from "@/src/services";

import { useNotification } from '@/layout/context/notificationContext';
import { Tag } from "primereact/tag";
import { Chip } from "primereact/chip";
import FormularioActividad from "./FormularioActividad";
import { link } from "fs";

const tiposBeneficiados = [
    { label: 'Hombre', value: 'Hombre' },
    { label: 'Mujer', value: 'Mujer' },
    { label: 'Otro', value: 'Otro' },
    { label: 'No aplica', value: 'No aplica' }
]

const prioridades = [
    { label: 'Alta', value: 'alta' },
    { label: 'Media', value: 'media' },
    { label: 'Baja', value: 'baja' }
];

const formularioSchema = Yup.object().shape({
    uuid: Yup.string().nullable(),
    nombre: Yup.string().required('El nombre es obligatorio'),
    tipo_actividad_id: Yup.number().required('El tipo de actividad es obligatorio'),
    capacitador_id: Yup.number().required('El capacitador es obligatorio'),
    beneficiario_id: Yup.number().required('El beneficiario es obligatorio'),
    responsable_id: Yup.number().required('El responsable es obligatorio'),
    fecha_inicio: Yup.date().required('La fecha de inicio es obligatoria'),
    fecha_fin: Yup.date().required('La fecha de fin es obligatoria'),
    persona_beneficiada: Yup.string().required('El campo persona beneficiada es obligatorio'),
    prioridad: Yup.string().required('La prioridad es obligatoria'),
    autoridad_participante: Yup.array().required('El campo autoridad participante es obligatorio'),
    link_drive: Yup.string().url('Debe ser una URL válida').nullable(),
    fecha_solicitud_constancia: Yup.date().nullable(),
    fecha_envio_constancia: Yup.date().nullable(),
    fecha_vencimiento_envio_encuesta: Yup.date().nullable(),
    fecha_envio_encuesta: Yup.date().nullable(),
    fecha_copy_creativo: Yup.date().nullable(),
    fecha_inicio_difusion_banner: Yup.date().nullable(),
    fecha_fin_difusion_banner: Yup.date().nullable(),
    link_registro: Yup.string().url('Debe ser una URL válida').nullable(),
    registro_nafin: Yup.string().nullable(),
    link_zoom: Yup.string().url('Debe ser una URL válida').nullable(),
    link_panelista: Yup.string().url('Debe ser una URL válida').nullable(),
    comentario: Yup.string().nullable(),
    //documento es de tipo file y multiple
    documento: Yup.array().of(Yup.object().shape({
        name: Yup.string().required('El nombre del archivo es obligatorio'),
        size: Yup.number().required('El tamaño del archivo es obligatorio'),
        type: Yup.string().required('El tipo de archivo es obligatorio'),
        lastModified: Yup.number().required('La fecha de modificación es obligatoria'),
    })).nullable(),
});

const ActividadPage = () => {

    const [proyecto, setProyecto] = useState<any>({});
    const [actividades, setActividades] = useState<any>([]);
    const [tiposActividad, setTiposActividad] = useState<any>([]);  
    const [beneficiarios, setBeneficiarios] = useState<any>([]);  
    const [autoridades, setAutoridades] = useState<any>([]);  
    const [responsables, setResponsables] = useState<any>([]);  
    const [capacitadores, setCapacitadores] = useState<any>([]);  
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const { showError, showSuccess } = useNotification();
    const [loadingGuardar, setLoadingGuardar] = useState(false);
    const [visibleFormulario, setVisibleFormulario] = useState(false);
    const [deletingRows, setDeletingRows] = useState<{ [key: string]: boolean }>({});
    const [formularioActividad, setFormularioActividad] = useState<any>({});
    const [formularioErrors, setFormularioErrors] = useState<{ [key: string]: string }>({});
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const params =  useParams();

    const id = params.id;
    
    useEffect(() => {
       
        let isMounted = true; // Para evitar actualizaciones si el componente se desmonta
        setLoading(true);
        setActividades([]);
        setFormularioActividad({});
        setProyecto({});

        const fetchProyectoYActividades = async () => {
            try {
                // 1. Carga el proyecto
                const responseProyecto = await ProyectoService.getProyecto(id);
                if (!isMounted) return;
                setProyecto(responseProyecto.data);

                // 2. Solo si el proyecto se cargó, carga las actividades
                const responseTiposActividad = await TipoActividadService.getListTipoActividad();
                const responseBeneficiarios = await BeneficiarioService.getListBeneficiario();
                const responseAutoridades = await AutoridadService.getListAutoridad();
                const responseResponsables = await PersonaService.getListPersona();
                const responseCapacitadores = await CapacitadorService.getListCapacitador();
                const responseActividades = await ProyectoService.getListaActividadesPorProyectoUuid(id);
             
               
                if (!isMounted) return;

                setTiposActividad(responseTiposActividad.data);
                setBeneficiarios(responseBeneficiarios.data);
                setAutoridades(responseAutoridades.data);
                setResponsables(responseResponsables.data.map((item:any) => ({
                    ...item,
                    nombre: `${item.nombre} ${item.apellido_paterno} ${item.apellido_materno}`
                })));
                setCapacitadores(responseCapacitadores.data);
                setActividades(responseActividades.data);
              
                
            } catch (error) {
                showError('Error al cargar el proyecto o sus actividades');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchProyectoYActividades();

        return () => { isMounted = false; };
    }, [id]);

    const handleSaveData = async () => {
    
        setLoadingGuardar(true);

        try {

            await formularioSchema.validate(formularioActividad, { abortEarly: false });
    
            setFormularioErrors({});

            const contexto =  {
                ...formularioActividad,
                fecha_inicio: formularioActividad.fecha_inicio ? formularioActividad.fecha_inicio?.toISOString().slice(0, 10) : null,
                fecha_fin: formularioActividad.fecha_fin ? formularioActividad.fecha_fin?.toISOString().slice(0, 10) : null,
                link_drive: formularioActividad.link_drive || '',
                link_registro: formularioActividad.link_registro || '',
                link_zoom: formularioActividad.link_zoom || '',

            }
            console.log('contexto', contexto);
            const response:any = formularioActividad.uuid
                ? await ProyectoService.updateActividadPorProyectoUuid(formularioActividad.uuid, contexto)
                : await ProyectoService.createActividadPorProyectoUuid(proyecto?.uuid, contexto);

            const actividad = await response.data;

            updateRows(actividad);
            showSuccess('El registro se ha guardado correctamente');
            setVisibleFormulario(false);

        } catch (err: any) {
            console.error('Error al guardar la actividad:', err);

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
    
    const handleEditActividad = (e:any) => {
        setFormularioErrors({});
        const data = e.data;
        
        setFormularioActividad((_prev:any) => ({
            ...data,
            autoridad_participante: data.autoridad_participante.map((item:string) => parseInt(item)) || [],
        }));
    
        setVisibleFormulario(true);
        
    };

    const handleDeleteActividad = (event:any, e:any) => {

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
                        await ProyectoService.deleteActividadPorProyecto(proyecto?.uuid, data.uuid);
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
        setFormularioActividad({
            id: null,
            proyecto_id: null,
            nombre: '',
            descripcion: '',
            fecha_inicio: null,
            fecha_fin: null,
            estado: 'pendiente'
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

        setActividades((prev:any) => {

            let updatedActividades = [...prev];
            const index = updatedActividades.findIndex((actividad) => actividad.id === data.id);

            if(isDelete) {
                updatedActividades = updatedActividades.filter((_actividad:any, idx:any) => index !== idx)
            } else {
                if(index !== -1) {
                    updatedActividades[index] = {
                        ...data,
                    }; 
                } else {
                    updatedActividades = [...updatedActividades, data];
                }
                
            }
            return updatedActividades;
        });
    }

    // Custom templates
    const header = (
        <div className="flex justify-between">
        </div>
    ); 


    const headerTable = () => {
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

   return (
           <div className="grid">
               <div className="col-12">
                   <div className="card">
                       <div className="flex flex-row justify-content-between align-items-center gap-1 mb-3">
                           <Link href="/proyectos" passHref legacyBehavior>
                                <a>
                                    <Button
                                        label="Regresar"
                                        icon="pi pi-arrow-left"
                                        type="button"
                                    />
                                </a>
                            </Link>
                           <div className="flex flex-row justify-content-start align-items-center gap-2">
                               <h5 className="m-0 font-medium">Listado de actividades del proyecto</h5>   
                               <Chip label={proyecto.nombre} className="font-bold" />
                           </div>
                       </div>
        
                       <DataTable
                           value={actividades}
                           paginator
                           rows={10}
                           dataKey="uuid"
                           filters={filters}
                           filterDisplay="menu"
                           loading={loading}
                           emptyMessage="No se encontraron registros."
                           editMode='row'
                           header={headerTable()}
                       >
                           <Column 
                               field="tipo_actividad_nombre" 
                               header="Tipo actividad" 
                               filter 
                               filterPlaceholder="Busqueda por tipo de actividad" 
                               style={{ maxWidth: '4rem' }} />
   
                           <Column 
                               field="capacitador_nombre" 
                               header="Capacitador" 
                               filter 
                               filterPlaceholder="Busqueda por capacitador" 
                               style={{ maxWidth: '4rem' }} /> 
                           
                           <Column 
                               field="responsable_nombre" 
                               header="Responsable" 
                               filter 
                               filterPlaceholder="Busqueda por responsable" 
                               style={{ maxWidth: '4rem' }} />  
   
                           <Column 
                               field="nombre" 
                               header="Nombre" 
                               style={{ maxWidth: '8rem' }}
                               />                        
                           <Column 
                               body={(rowData, options) => actionsTemplate(rowData, options, {
                                   onEdit:handleEditActividad,
                                   onDelete:handleDeleteActividad
                               })}
                               bodyClassName="text-center" 
                               style={{ maxWidth: '2rem' }} />
                       </DataTable>
                   </div>
                   <FormularioActividad
                       visible={visibleFormulario}
                       onHide={() => setVisibleFormulario(false)}
                       onSave={handleSaveData}
                       initialData={formularioActividad}
                       errors={formularioErrors}
                       loading={loadingGuardar}
                       setFieldValue={(field, value) => {
                           setFormularioActividad((prev:any) => ({
                               ...prev,
                               [field]: value
                           }));
                       }}
                       tiposActividad={tiposActividad}
                       beneficiarios={beneficiarios}
                       autoridades={autoridades}
                       responsables={responsables}
                       capacitadores={capacitadores}
                       tiposBeneficiados={tiposBeneficiados}
                       prioridades={prioridades}
                   />   
               </div>
           </div>
       );
}

export default ActividadPage;