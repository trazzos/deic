'use client';
import React, { useEffect, useState, useRef } from 'react';
import * as Yup from 'yup';

import { ProgressBar } from 'primereact/progressbar';
import { Panel } from 'primereact/panel';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { confirmPopup } from 'primereact/confirmpopup';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import { DataScroller } from 'primereact/datascroller';
import { BreadCrumb } from "primereact/breadcrumb";
import { MenuItem } from "primereact/menuitem";
import { Badge } from 'primereact/badge';

// Components
import FormularioActividad  from './FormularioActividad'
import FormularioProyecto from './FormularioProyecto';
import EmptyStateProject from './components/EmptyStateProject';
import EmptyStateActivity from './components/EmptyStateActivity';
import RepositorioDocumentos from './components/RepositorioDocumentos';

import { 
    ProyectoService,
    DependenciaProyectoService,
} from '@/src/services';
import type { Proyecto } from '@/types';
import { useNotification } from '@/layout/context/notificationContext';
import { useFormErrorHandler } from '@/src/utils/errorUtils';

const schemaActividad = Yup.object().shape({
    uuid: Yup.string().nullable(),
    nombre: Yup.string().required('El nombre es obligatorio'),
    tipo_actividad_id: Yup.number().required('El tipo de actividad es obligatorio'),
    capacitador_id: Yup.number().nullable(),
    beneficiario_id: Yup.number().required('El beneficiario es obligatorio'),
    responsable_id: Yup.number().required('El responsable es obligatorio'),
    fecha_inicio: Yup.date().required('La fecha de inicio es obligatoria'),
    fecha_fin: Yup.date().required('La fecha de fin es obligatoria'),
    persona_beneficiada: Yup.array()
        .of(
            Yup.object({
                nombre: Yup.string().oneOf(['Hombre','Mujer','Otro']).required(),
                total: Yup.number().integer('Debe ser un entero').min(0, 'No puede ser negativo').required()
            })
        )
        .required('El campo persona beneficiada es obligatorio')
        .test('contiene-tres-tipos', 'Debe incluir Hombre, Mujer y Otro', (arr:any) => {
            if (!Array.isArray(arr)) return false;
            const nombres = arr.map((i:any) => i?.nombre);
            return ['Hombre','Mujer','Otro'].every(t => nombres.includes(t));
        }),
    prioridad: Yup.string().required('La prioridad es obligatoria'),
    autoridad_participante: Yup.array()
        .of(Yup.number())
        .nullable(),
    link_drive: Yup.string().url('Debe ser una URL válida').nullable(),
    fecha_solicitud_constancia: Yup.date().nullable(),
    fecha_envio_constancia: Yup.date().nullable(),
    fecha_vencimiento_envio_encuesta: Yup.date().nullable(),
    fecha_envio_encuesta: Yup.date().nullable(),
    fecha_inicio_difusion_banner: Yup.date().nullable(),
    fecha_fin_difusion_banner: Yup.date().nullable(),
    link_registro: Yup.string().url('Debe ser una URL válida').nullable(),
    registro_nafin: Yup.string().nullable(),
    link_zoom: Yup.string().url('Debe ser una URL válida').nullable(),
    link_panelista: Yup.string().url('Debe ser una URL válida').nullable(),
    comentario: Yup.string().nullable(),
    documento: Yup.array().of(Yup.object().shape({
        name: Yup.string().required('El nombre del archivo es obligatorio'),
        size: Yup.number().required('El tamaño del archivo es obligatorio'),
        type: Yup.string().required('El tipo de archivo es obligatorio'),
        lastModified: Yup.number().required('La fecha de modificación es obligatoria'),
    })).nullable(),
});

const schemaProyecto = Yup.object().shape({
    tipoProyecto: Yup.string().required('El tipo de proyecto es obligatorio'),
    departamento: Yup.string().required('El departamento es obligatorio'),
    nombre: Yup.string().required('El nombre es obligatorio'),
    descripcion: Yup.string().required('La descripción es obligatoria'),
});

const tiposBeneficiados = [
    { label: 'Hombre', value: 'Hombre' },
    { label: 'Mujer', value: 'Mujer' },
    { label: 'Otro', value: 'Otro' },
];

const prioridades = [
    { label: 'Alta', value: 'Alta' },
    { label: 'Media', value: 'Media' },
    { label: 'Baja', value: 'Baja' }
];

const ProyectoPage = () => {

    const [proyectos, setProyectos] = useState<any[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [tiposProyecto, setTiposProyecto] = useState<any[]>([]);
    const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingGuardar, setLoadingGuardar] = useState(false);
    const [loadingGuardarActividad, setLoadingGuardarActividad] = useState(false);
    const [visibleFormulario, setVisibleFormulario] = useState(false);
    const [deletingRows, setDeletingRows] = useState<any>({});
    const [formularioActividad, setFormularioActividad] = useState<any>({});
    const { showError, showSuccess } = useNotification();

    // Estado para el repositorio de documentos
    const [visibleRepositorioDocumentos, setVisibleRepositorioDocumentos] = useState(false);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [hasMore, setHasMore] = useState(true);
    const [openPanelActividad, setOpenPanelActividad] = useState(false);
    const [openPanelProyecto, setOpenPanelProyecto] = useState(false);
    const [showDetailPanel, setShowDetailPanel] = useState(true);

    // Proyectos
    const [proyectoActivo, setProyectoActivo] = useState<any>({});
    const initStateFormularioProyecto = {
        uuid:null,
        tipoProyecto:null,
        departamento:null,
        nombre: '',
        descripcion: '',
    };
    const [formularioProyecto, setFormularioProyecto] = useState<Proyecto>(initStateFormularioProyecto);
    const [formularioErrors, setFormularioErrors] = useState<{ [key: string]: string }>({});
    const [loadingActividadesProyecto, setLoadingActividadesProyecto] = useState(false);

    // Actividades
    const [actividades, setActividades] = useState<any>([]);
    const [actividadSeleccionada, setActividadSeleccionada] = useState<any>({});
    const [visibleFormularioActividad, setVisibleFormularioActividad] = useState(false);
    const [formularioActividadErrors, setFormularioActividadErrors] = useState<{ [key: string]: string }>({});
    const [tiposActividad, setTiposActividad] = useState<any>([]);  
    const [beneficiarios, setBeneficiarios] = useState<any>([]);  
    const [autoridades, setAutoridades] = useState<any>([]);  
    const [responsables, setResponsables] = useState<any>([]);  
    const [capacitadores, setCapacitadores] = useState<any>([]);  
    const [actividadCollapsed, setActividadCollapsed] = useState<{ [key: string]: boolean }>({});
    const [nuevaTareaActividad, setNuevaTareaActividad] = useState<{ [key: string]: string }>({});
    const [loadingTareasActividad, setLoadingTareasActividad] = useState<{ [key: string]: boolean }>({});

    // Cache para actividades y tareas por proyecto
    // Permite mantener el avance de proyectos sin perder los datos al cambiar entre proyectos
    // actividadesPorProyecto: { [proyectoUuid]: actividad[] }
    // tareasPorProyecto: { [proyectoUuid]: { [actividadUuid]: tarea[] } }
    const [actividadesPorProyecto, setActividadesPorProyecto] = useState<{ [key: string]: any[] }>({});
    const [tareasPorProyecto, setTareasPorProyecto] = useState<{ [key: string]: { [key: string]: any[] } }>({});
    
    // Seguimiento de proyectos que han sido cargados con actividades para cálculo de avance
    const [proyectosCargados, setProyectosCargados] = useState<Set<string>>(new Set());
    
    // Tareas del proyecto activo (para mantener compatibilidad con el código existente)
    const [tareasPorActividad, setTareasPorActividad] = useState<any>({});
  
    // Función para calcular si una actividad está completada (todas sus tareas están completadas)
    const isActividadCompletada = (actividadUuid: string, proyectoUuid?: string): boolean => {
        const proyectoId = proyectoUuid || proyectoActivo?.uuid;
        
        // Buscar las tareas en el caché del proyecto específico
        const tareasDelProyecto = tareasPorProyecto[proyectoId];
        const tareas = tareasDelProyecto?.[actividadUuid] || [];
        
        // Si hay tareas cargadas, calcular basándose en ellas
        if (tareas.length > 0) {
            return tareas.every((tarea: any) => tarea.estatus === 'Completada');
        }
        
        // Si no hay tareas cargadas, usar el porcentaje_avance del backend
        // Buscar la actividad en las actividades cargadas o en caché
        const actividadesDelProyecto = actividadesPorProyecto[proyectoId] || 
                                     (proyectoId === proyectoActivo?.uuid ? actividades : []);
        
        const actividad = actividadesDelProyecto.find((act: any) => act.uuid === actividadUuid);
        if (actividad && typeof actividad.porcentaje_avance === 'number') {
            // Considerar completada si el avance es 100%
            return actividad.porcentaje_avance >= 100;
        }
        
        // Por defecto, no completada si no hay información
        return false;
    };

    // Función para calcular el avance de una actividad específica
    const calcularAvanceActividad = (actividadUuid: string, proyectoUuid?: string): number => {
        const proyectoId = proyectoUuid || proyectoActivo?.uuid;
        
        // Buscar las tareas en el caché del proyecto específico
        const tareasDelProyecto = tareasPorProyecto[proyectoId];
        const tareas = tareasDelProyecto?.[actividadUuid] || [];
        
        // Si hay tareas cargadas, calcular basándose en ellas
        if (tareas.length > 0) {
            const tareasCompletadas = tareas.filter((tarea: any) => tarea.estatus === 'Completada').length;
            return Math.round((tareasCompletadas / tareas.length) * 100);
        }
        
        // Si no hay tareas cargadas, usar el porcentaje_avance del backend
        const actividadesDelProyecto = actividadesPorProyecto[proyectoId] || 
                                     (proyectoId === proyectoActivo?.uuid ? actividades : []);
        
        const actividad = actividadesDelProyecto.find((act: any) => act.uuid === actividadUuid);
        if (actividad && typeof actividad.porcentaje_avance === 'number') {
            return actividad.porcentaje_avance;
        }
        
        // Por defecto, 0% si no hay información
        return 0;
    };

    // Función para calcular el avance del proyecto basado en actividades completadas
    // Una actividad se considera completada cuando todas sus tareas están marcadas como 'Completada'
    // El avance se calcula como: (actividades completadas / total actividades) * 100
    const calcularAvanceProyecto = (proyectoUuid?: string): number => {
        const proyectoParaCalcular = proyectoUuid || proyectoActivo?.uuid;
        
        if (!proyectoParaCalcular) return 0;

        // Si tenemos actividades en caché para este proyecto, usarlas para el cálculo
        const actividadesDelProyecto = actividadesPorProyecto[proyectoParaCalcular] || 
                                     (proyectoParaCalcular === proyectoActivo?.uuid ? actividades : []);

        // Si el proyecto ha sido cargado previamente y tenemos actividades en caché, usar cálculo basado en actividades
        if (proyectosCargados.has(proyectoParaCalcular) && actividadesDelProyecto.length > 0) {
            const actividadesCompletadas = actividadesDelProyecto.filter((actividad: any) => 
                isActividadCompletada(actividad.uuid, proyectoParaCalcular)
            ).length;
            
            return Math.round((actividadesCompletadas / actividadesDelProyecto.length) * 100);
        }

        // Para proyectos no activos que no han sido cargados, usar porcentaje del backend
        if (proyectoUuid && proyectoUuid !== proyectoActivo?.uuid && !proyectosCargados.has(proyectoParaCalcular)) {
            const proyecto = proyectos.find(p => p.uuid === proyectoUuid);
            if (proyecto && typeof proyecto.porcentaje_avance === 'number') {
                return proyecto.porcentaje_avance;
            }
        }

        // Si no hay actividades cargadas, usar el valor del backend si está disponible
        if (!actividadesDelProyecto || actividadesDelProyecto.length === 0) {
            const proyecto = proyectos.find(p => p.uuid === proyectoParaCalcular);
            if (proyecto && typeof proyecto.porcentaje_avance === 'number') {
                return proyecto.porcentaje_avance;
            }
            return 0;
        }
        
        // Cálculo basado en actividades para el proyecto activo
        const actividadesCompletadas = actividadesDelProyecto.filter((actividad: any) => 
            isActividadCompletada(actividad.uuid, proyectoParaCalcular)
        ).length;
        
        return Math.round((actividadesCompletadas / actividadesDelProyecto.length) * 100);
    };

    // Funciones para gestión del caché
    const updateActividadesCache = (proyectoUuid: string, nuevasActividades: any[]) => {
        setActividadesPorProyecto(prev => ({
            ...prev,
            [proyectoUuid]: nuevasActividades
        }));
        
        // Marcar el proyecto como cargado para permitir cálculo de avance con caché
        setProyectosCargados(prev => {
            const newSet = new Set(prev);
            newSet.add(proyectoUuid);
            return newSet;
        });
    };

    const updateTareasCache = (proyectoUuid: string, actividadUuid: string, nuevasTareas: any[]) => {
        setTareasPorProyecto(prev => ({
            ...prev,
            [proyectoUuid]: {
                ...prev[proyectoUuid],
                [actividadUuid]: nuevasTareas
            }
        }));
        
        // También actualizar el estado local si es el proyecto activo
        if (proyectoUuid === proyectoActivo?.uuid) {
            setTareasPorActividad((prev: any) => ({
                ...prev,
                [actividadUuid]: nuevasTareas
            }));
        }
    };

    const loadTareasFromCache = (proyectoUuid: string) => {
        const tareasDelProyecto = tareasPorProyecto[proyectoUuid] || {};
        setTareasPorActividad(tareasDelProyecto);
    };

    // Función para invalidar caché cuando sea necesario
    const invalidarCacheProyecto = (proyectoUuid: string) => {
        setActividadesPorProyecto(prev => {
            const newCache = { ...prev };
            delete newCache[proyectoUuid];
            return newCache;
        });
        
        setTareasPorProyecto(prev => {
            const newCache = { ...prev };
            delete newCache[proyectoUuid];
            return newCache;
        });
    };

    // Función para actualizar el avance del proyecto en la lista después de cambios
    const actualizarAvanceProyectoEnLista = (proyectoUuid: string) => {
        if (proyectoUuid === proyectoActivo?.uuid) {
            const nuevoAvance = calcularAvanceProyecto(proyectoUuid);
            setProyectos(prev => prev.map(proyecto => 
                proyecto.uuid === proyectoUuid 
                    ? { ...proyecto, porcentaje_avance: nuevoAvance }
                    : proyecto
            ));
        }
    };

    // Función para refrescar el avance desde el backend (opcional)
    const refrescarAvanceDesdeBackend = async (proyectoUuid: string) => {
        try {
            const response = await ProyectoService.getProyecto(proyectoUuid);
            const proyectoActualizado = response.data;
            
            setProyectos(prev => prev.map(proyecto => 
                proyecto.uuid === proyectoUuid 
                    ? { ...proyecto, porcentaje_avance: proyectoActualizado.porcentaje_avance }
                    : proyecto
            ));
        } catch (error) {
            console.error('Error al refrescar avance desde backend:', error);
        }
    };

    // Función para actualizar el avance de una actividad en el caché
    const actualizarAvanceActividadEnCache = (proyectoUuid: string, actividadUuid: string) => {
        const nuevoAvance = calcularAvanceActividad(actividadUuid, proyectoUuid);
        
        // Obtener información de tareas si están cargadas
        const tareasDelProyecto = tareasPorProyecto[proyectoUuid];
        const tareas = tareasDelProyecto?.[actividadUuid] || [];
        
        // Preparar datos actualizados
        let datosActualizados: any = { porcentaje_avance: nuevoAvance };
        
        // Si hay tareas cargadas, actualizar también los contadores
        if (tareas.length > 0) {
            const tareasCompletadas = tareas.filter((tarea: any) => tarea.estatus === 'Completada').length;
            const tareasPendientes = tareas.length - tareasCompletadas;
            
            datosActualizados = {
                ...datosActualizados,
                total_tareas: tareas.length,
                tareas_completadas: tareasCompletadas,
                tareas_pendientes: tareasPendientes
            };
        }
        
        // Actualizar en el caché de actividades
        setActividadesPorProyecto(prev => ({
            ...prev,
            [proyectoUuid]: prev[proyectoUuid]?.map(actividad => 
                actividad.uuid === actividadUuid 
                    ? { ...actividad, ...datosActualizados }
                    : actividad
            ) || []
        }));
        
        // También actualizar en el estado local si es el proyecto activo
        if (proyectoUuid === proyectoActivo?.uuid) {
            setActividades((prev: any) => prev.map((actividad: any) => 
                actividad.uuid === actividadUuid 
                    ? { ...actividad, ...datosActualizados }
                    : actividad
            ));
        }
    };
    
    // Handlers proyectos
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
          
            await schemaProyecto.validate(formularioProyecto, { abortEarly: false });
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

            if(!formularioProyecto.uuid) {

                setActividadSeleccionada({});
                setActividades([]);
                setProyectoActivo((prev:any) => ({
                    ...prev,
                    ...proyecto,
                }));

            }

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

                    // Check if the deleted project is the currently selected one
                    if (proyectoActivo.uuid === data.uuid) {
                        // Reset the selected project and panels
                        setProyectoActivo({});
                        setOpenPanelProyecto(false);
                        setOpenPanelActividad(false);
                        // Clear activities and tasks for the deleted project
                        setActividades([]);
                        setTareasPorActividad({});
                    }

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

    const onAgregar = () => {
      setFormularioProyecto(initStateFormularioProyecto);  
      setVisibleFormulario(true);  
    }

    const loadMoreProyectos = async () => {

        if (!hasMore || loading) return;

        setLoading(true);

        try {
                const response = await ProyectoService.paginateProyecto(page + 1, perPage);
                if (response.data.length === 0) {
                    setHasMore(false);
                } else {
                    setProyectos(prev => [...prev, ...response.data]);
                    setPage(prev => prev + 1);
                }
            } finally {
                setLoading(false);
            }
    };

    const handleResetControlsProyecto  = () => {
        setFormularioProyecto(initStateFormularioProyecto);
        setFormularioErrors({});
        setVisibleFormulario(false);
        setProyectoActivo({});
        // No resetear proyectosCargados aquí para mantener el caché de avance
    };

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

    const onSelectProyecto = async (proyecto:any) => {
       
        const data = proyecto;
        setProyectoActivo(data);
        setOpenPanelProyecto(true);
        setOpenPanelActividad(false);
        setShowDetailPanel(true); // Show the detail panel when a project is selected
        
        // Verificar si ya tenemos las actividades en caché
        const actividadesEnCache = actividadesPorProyecto[data.uuid];
        
        if (actividadesEnCache) {
            // Usar datos del caché
            setActividades(actividadesEnCache);
            loadTareasFromCache(data.uuid);
            setLoadingActividadesProyecto(false);
        } else {
            // Cargar desde el servidor y guardar en caché
            setLoadingActividadesProyecto(true);
            try {
                const responseActividades = await ProyectoService.getListaActividadesPorProyectoUuid(data?.uuid);
                const nuevasActividades = responseActividades.data;
                
                setActividades(nuevasActividades);
                updateActividadesCache(data.uuid, nuevasActividades);
                
                // Limpiar tareas del proyecto activo
                setTareasPorActividad({});
            } catch (error) {
                console.error('Error al cargar actividades:', error);
            } finally {
                setLoadingActividadesProyecto(false);
            }
        }
    };

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
            // Si el proyecto actualizado es el activo, actualizar también el estado
            if (proyectoActivo?.uuid === data.uuid) {
                setProyectoActivo((prev:any) => ({ ...prev, ...data }));
                setFormularioProyecto((prev:any) => ({ ...prev, ...data }));
            }
            return updatedProyectos;
        });
    }

    // handlers actividades
    const handleActividadesError = useFormErrorHandler(setFormularioActividadErrors, showError);
    const handleSaveDataActividad = async () => {   
        
        setLoadingGuardarActividad(true);

        try {

            await schemaActividad.validate(formularioActividad, { abortEarly: false });
            setFormularioActividadErrors({});

            const contexto =  {
                ...formularioActividad,
                fecha_inicio: formularioActividad.fecha_inicio ? formularioActividad.fecha_inicio?.toISOString().slice(0, 10) : null,
                fecha_fin: formularioActividad.fecha_fin ? formularioActividad.fecha_fin?.toISOString().slice(0, 10) : null,
                fecha_solicitud_constancia: formularioActividad.fecha_solicitud_constancia ? formularioActividad.fecha_solicitud_constancia?.toISOString().slice(0, 10) : null,
                fecha_envio_constancia: formularioActividad.fecha_envio_constancia ? formularioActividad.fecha_envio_constancia?.toISOString().slice(0, 10) : null,
                fecha_vencimiento_envio_encuesta: formularioActividad.fecha_vencimiento_envio_encuesta ? formularioActividad.fecha_vencimiento_envio_encuesta?.toISOString().slice(0, 10) : null,
                fecha_envio_encuesta: formularioActividad.fecha_envio_encuesta ? formularioActividad.fecha_envio_encuesta?.toISOString().slice(0, 10) : null,
                fecha_copy_creativo: formularioActividad.fecha_copy_creativo ? formularioActividad.fecha_copy_creativo?.toISOString().slice(0, 10) : null,
                fecha_inicio_difusion_banner: formularioActividad.fecha_inicio_difusion_banner ? formularioActividad.fecha_inicio_difusion_banner?.toISOString().slice(0, 10) : null,
                fecha_fin_difusion_banner: formularioActividad.fecha_fin_difusion_banner ? formularioActividad.fecha_fin_difusion_banner?.toISOString().slice(0, 10) : null,
                persona_beneficiada: Array.isArray(formularioActividad.persona_beneficiada)
                    ? formularioActividad.persona_beneficiada
                    : ((): any[] => {
                        try {
                            const raw = formularioActividad.persona_beneficiada;
                            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                            if (Array.isArray(parsed)) return parsed;
                            if (parsed && typeof parsed === 'object') {
                                return ['Hombre','Mujer','Otro'].map((k) => ({ nombre: k, total: Number(parsed[k]) || 0 }));
                            }
                        } catch {}
                        return ['Hombre','Mujer','Otro'].map((k) => ({ nombre: k, total: 0 }));
                    })(),
                link_drive: formularioActividad.link_drive || '',
                link_registro: formularioActividad.link_registro || '',
                link_zoom: formularioActividad.link_zoom || '',
                link_panelista: formularioActividad.link_panelista || ''
            }
        
            const response:any = formularioActividad.uuid
                ? await ProyectoService.updateActividadPorProyectoUuid(proyectoActivo.uuid, formularioActividad.uuid, contexto)
                : await ProyectoService.createActividadPorProyectoUuid(proyectoActivo?.uuid, contexto);

            const actividad = await response.data;

            updateActividades(actividad);
            setFormularioActividad({});
            setVisibleFormularioActividad(false);
            showSuccess('El registro se ha guardado correctamente');

        } catch (err: any) {
            // Si la validación falla, Yup lanza un error con la propiedad 'inner' que contiene los errores individuales
            if (err.inner) {
                const errors: { [key: string]: string } = {};
                err.inner.forEach((validationError: any) => {
                    if (validationError.path) {
                        errors[validationError.path] = validationError.message;
                    }
                });
                setFormularioActividadErrors(errors);
            } else {
               handleActividadesError(err);
            }
        } finally {
            setLoadingGuardarActividad(false);
        };
    }
    
    const onEditActividad = (e:any) => {

        const data = e.item.itemData;

        setFormularioActividadErrors({});
        setFormularioActividad({});
        setFormularioActividad((_prev:any) => ({
            ...data,
            autoridad_participante: Array.isArray(data.autoridad_participante) ?  data.autoridad_participante.map((item:string) => parseInt(item)) : [],
            fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : null,
            fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : null,
            fecha_solicitud_constancia: data.fecha_solicitud_constancia ? new Date(data.fecha_solicitud_constancia) : null,
            fecha_envio_constancia: data.fecha_envio_constancia ? new Date(data.fecha_envio_constancia) : null,
            fecha_vencimiento_envio_encuesta: data.fecha_vencimiento_envio_encuesta ? new Date(data.fecha_vencimiento_envio_encuesta) : null,   
            fecha_envio_encuesta: data.fecha_envio_encuesta ? new Date(data.fecha_envio_encuesta) : null,
            fecha_copy_creativo: data.fecha_copy_creativo ? new Date(data.fecha_copy_creativo) : null,
            fecha_inicio_difusion_banner: data.fecha_inicio_difusion_banner ? new Date(data.fecha_inicio_difusion_banner) : null,
            fecha_fin_difusion_banner: data.fecha_fin_difusion_banner ? new Date(data.fecha_fin_difusion_banner) : null,
            persona_beneficiada: (() => {
                const raw = data.persona_beneficiada;
                try {
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    if (Array.isArray(parsed)) return parsed;
                    if (parsed && typeof parsed === 'object') {
                        return ['Hombre','Mujer','Otro'].map((k) => ({ nombre: k, total: Number(parsed[k]) || 0 }));
                    }
                } catch {
                    return ['Hombre','Mujer','Otro'].map((k) => ({ nombre: k, total: 0 }));
                }
            })(),
        }));
        
    
        setVisibleFormularioActividad(true);
    }

    const onAgregarActividad = () => {
        setFormularioActividad({
            id: null,
            proyecto_id: null,
            nombre: '',
            descripcion: '',
            fecha_inicio: null,
            fecha_fin: null,
            estado: 'pendiente',
            persona_beneficiada: ['Hombre','Mujer','Otro'].map((k) => ({ nombre: k, total: 0 }))
        });
        setVisibleFormularioActividad(true);
    };

    const onDeleteActividad = (event:any, e:any) => {
        confirmPopup({
            target: event.currentTarget,
            message: '¿Esta seguro de realizar esta acción?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Si',
            rejectLabel: 'No',
            accept: () => {
                ProyectoService.deleteActividadPorProyecto(proyectoActivo.uuid, e.itemData.uuid)
                    .then(() => {
                        // Remove from current activities list
                        setActividades((prev: any) => prev.filter((act: any) => act.uuid !== e.itemData.uuid));
                        
                        // Remove from activities cache for this project
                        setActividadesPorProyecto(prev => ({
                            ...prev,
                            [proyectoActivo.uuid]: prev[proyectoActivo.uuid]?.filter((act: any) => act.uuid !== e.itemData.uuid) || []
                        }));
                        
                        // Remove tasks for this activity from cache
                        setTareasPorProyecto(prev => {
                            const newCache = { ...prev };
                            if (newCache[proyectoActivo.uuid]) {
                                const { [e.itemData.uuid]: deletedActivityTasks, ...restTasks } = newCache[proyectoActivo.uuid];
                                newCache[proyectoActivo.uuid] = restTasks;
                            }
                            return newCache;
                        });
                        
                        // Reset selected activity if it's the one being deleted
                        if (actividadSeleccionada.uuid === e.itemData.uuid) {
                            setActividadSeleccionada({});
                            setOpenPanelActividad(false);
                            setOpenPanelProyecto(true);
                        }
                        
                        showSuccess('Actividad eliminada correctamente');
                    })
                    .catch((error: any) => showError(error.message || 'Ha ocurrido un error al eliminar la actividad'));
            }
        });
    }

    const handleResetControlsActividad = () => {

        setActividades([]);
        setFormularioActividad({});
        setActividadSeleccionada({});
        setFormularioActividadErrors({});
    }

    useEffect(() => {

        handleResetControlsProyecto();
        handleResetControlsActividad();
        setLoading(true);

        const fetchCatalogos = async () => {
            try {
                // Ejecutar las peticiones de forma concurrente: dependencias y proyectos
                const [
                    responseDependencias,
                    responseProyectos
                ] = await Promise.all([
                    DependenciaProyectoService.getAll(),
                    ProyectoService.paginateProyecto(page, perPage)
                ]);

                // Extraer los catálogos de la respuesta de dependencias
                const dependencias = responseDependencias.data;
                
                // Actualizar todos los estados con los datos de dependencias
                setDepartamentos(dependencias.departamentos || []);
                setTiposDocumento(dependencias.tipos_documento || []);
                setTiposProyecto(dependencias.tipos_proyecto || []);
                setTiposActividad(dependencias.tipos_actividad || []);
                setBeneficiarios(dependencias.beneficiarios || []);
                setAutoridades(dependencias.autoridades || []);
                setResponsables((dependencias.responsables || []).map((item: any) => ({
                    ...item,
                    nombre: `${item.nombre} ${item.apellido_paterno} ${item.apellido_materno}`
                })));
                setCapacitadores(dependencias.capacitadores || []);
                
                // Actualizar proyectos
                setProyectos(responseProyectos.data);
            } catch (error: any) {
                showError(error.message || 'Ha ocurrido un error al cargar los datos');
            } finally {
                setLoading(false);
            }
        };

        fetchCatalogos();
    }, []);

    const cleanRowsDeleting = (data:any) => {

        setDeletingRows((prev:any) => {
            const newRowsDeleting = { ...prev };
            delete newRowsDeleting[data.uuid];
            return newRowsDeleting;
        });
    }

    const updateActividades = (data:any, isDelete:boolean=false) => {
        setActividades((prev:any) => {
            let updatedActividades = [...prev];
            const index = updatedActividades.findIndex((actividad) => actividad.uuid === data.uuid);

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
            // Actualizar caché de actividades
            if (proyectoActivo?.uuid) {
                updateActividadesCache(proyectoActivo.uuid, updatedActividades);
            }
            // Si la actividad actualizada es la seleccionada, actualizar también el estado
            if (actividadSeleccionada?.uuid === data.uuid) {
                setActividadSeleccionada((prev:any) => ({ ...prev, ...data }));
                setFormularioActividad((prev:any) => ({ ...prev, ...data }));
            }
            return updatedActividades;
        });
    }

    const seleccionarActividad = (actividad: any) => {
       
        
        if (actividad.uuid === actividadSeleccionada?.uuid) {
            setActividadSeleccionada({});
            setOpenPanelActividad(false);
            setOpenPanelProyecto(true);
            // Keep the detail panel visible
        } else {
            setOpenPanelActividad(true);
            setOpenPanelProyecto(false);
            setActividadSeleccionada({ ...actividad });
            setShowDetailPanel(true); // Show the detail panel when an activity is selected
        }
    };

    const onTogglePanelActividad = async (e:any, actividad:any) => {   
        
        setActividadCollapsed((prev: any) => ({
                ...prev,
                [actividad.uuid]: e.value
        }));

        if (!e.value) {
            // Verificar si ya tenemos las tareas en caché
            const tareasEnCache = tareasPorProyecto[proyectoActivo.uuid]?.[actividad.uuid];
            
            if (tareasEnCache) {
                // Usar datos del caché
                setTareasPorActividad((prev: any) => ({ ...prev, [actividad.uuid]: tareasEnCache }));
            } else {
                // Cargar desde el servidor y guardar en caché
                setLoadingTareasActividad((prev: any) => ({ ...prev, [actividad.uuid]: true }));
                try {
                    const tareas = await ProyectoService.getListaTareasPorActividadUuid(proyectoActivo.uuid, actividad.uuid);
                    const nuevasTareas = tareas.data;
                    
                    setTareasPorActividad((prev: any) => ({ ...prev, [actividad.uuid]: nuevasTareas }));
                    updateTareasCache(proyectoActivo.uuid, actividad.uuid, nuevasTareas);
                } catch (error) {
                    console.error('Error al cargar tareas:', error);
                } finally {
                    setLoadingTareasActividad((prev: any) => ({ ...prev, [actividad.uuid]: false }));
                }
            }
        } else {
            setTareasPorActividad((prev: any) => ({ ...prev, [actividad.uuid]: [] }));
        }
    }

    const onChangeEstatusActividad = async (actividad:any, tarea:any) => {

        let response;
        
        // Si la tarea está completada, marcarla como pendiente; si no, completarla
        if (tarea.estatus === 'Completada') {
            response = await ProyectoService.markAsPendingTareaPorActividadUuid(proyectoActivo.uuid, actividad.uuid, tarea.id);
        } else {
            response = await ProyectoService.markAsCompleteTareaPorActividadUuid(proyectoActivo.uuid, actividad.uuid, tarea.id);
        }
        
        const updatedTarea = response.data;
        
        const nuevasTareas = (tareasPorActividad[actividad.uuid] || []).map((t: any) =>
            t.id === tarea.id ? { ...updatedTarea, editing: false } : t
        );
        
        setTareasPorActividad((prev: any) => ({
            ...prev,
            [actividad.uuid]: nuevasTareas
        }));
        
        // Actualizar caché
        updateTareasCache(proyectoActivo.uuid, actividad.uuid, nuevasTareas);
        
        // Actualizar avance de la actividad en el caché
        actualizarAvanceActividadEnCache(proyectoActivo.uuid, actividad.uuid);
        
        // Actualizar avance del proyecto en la lista
        actualizarAvanceProyectoEnLista(proyectoActivo.uuid);
    }

    const onBlurTareaActividad = async (e:any, actividad:any, tarea:any) => {
        
        e.preventDefault();
        if (tarea.editing) {
            const resUp = await ProyectoService.updateTareaPorActividadUuid(proyectoActivo.uuid, actividad.uuid, tarea.id, { nombre: e.target.value });
            const updatedTarea = resUp.data;
            
            const nuevasTareas = (tareasPorActividad[actividad.uuid] || []).map((t: any) =>
                t.id === tarea.id ? { ...updatedTarea, editing: false } : t
            );
            
            setTareasPorActividad((prev: any) => ({
                ...prev,
                [actividad.uuid]: nuevasTareas
            }));
            
            // Actualizar caché
            updateTareasCache(proyectoActivo.uuid, actividad.uuid, nuevasTareas);
        }
    }

    const onKeyDownTareaActividad =  async (e:any, actividad:any, tarea:any) => {

        if (e.key === 'Enter') {
            e.preventDefault();
            if (tarea.editing) {
                const resUp = await ProyectoService.updateTareaPorActividadUuid(proyectoActivo.uuid, actividad.uuid, tarea.id, { nombre: e.target.value });
                const updatedTarea = resUp.data;
                
                const nuevasTareas = (tareasPorActividad[actividad.uuid] || []).map((t: any) =>
                    t.id === tarea.id ? { ...updatedTarea, editing: false } : t
                );
                
                setTareasPorActividad((prev: any) => ({
                    ...prev,
                    [actividad.uuid]: nuevasTareas
                }));
                
                // Actualizar caché
                updateTareasCache(proyectoActivo.uuid, actividad.uuid, nuevasTareas);
            }
        }
    }

    const onChangeTareaActividad = async (e:any, actividad:any, tarea:any) => {   
        setTareasPorActividad((prev: any) => ({
            ...prev,
            [actividad.uuid]: prev[actividad.uuid].map((t: any) =>
                t.id === tarea.id ? { ...t, editing: true } : t
            )
        }));
    }

    const onDoubleClickTareaActividad = async (e:any, actividad:any, tarea:any) => {   

        e.preventDefault();
        e.stopPropagation();
        setTareasPorActividad((prev: any) => ({
            ...prev,
            [actividad.uuid]: prev[actividad.uuid].map((t: any) =>
                t.id === tarea.id ? { ...t, editing: true } : t
            )
        }));
    }

    const onDeleteTareaActividad = async (actividad:any, tarea:any) => { 

        await ProyectoService.deleteTareaPorActividadUuid(proyectoActivo.uuid, actividad.uuid, tarea.id);
        
        const nuevasTareas = (tareasPorActividad[actividad.uuid] || []).filter((t: any) => t.id !== tarea.id);
        
        setTareasPorActividad((prev: any) => ({
            ...prev,
            [actividad.uuid]: nuevasTareas
        }));
        
        // Actualizar caché
        updateTareasCache(proyectoActivo.uuid, actividad.uuid, nuevasTareas);
        
        // Actualizar avance de la actividad en el caché
        actualizarAvanceActividadEnCache(proyectoActivo.uuid, actividad.uuid);
        
        // Actualizar avance del proyecto en la lista
        actualizarAvanceProyectoEnLista(proyectoActivo.uuid);
    }

    const onChangeNuevaTareaActividad = async (e:any, actividad:any) => {
       
        setNuevaTareaActividad((prev) => ({
            ...prev,
            [actividad.uuid]: e.target.value
        }));
    }

    const onAddNuevaTareaActividad = async (actividad: any) => {

        const nombre = (nuevaTareaActividad[actividad.uuid] || '').trim();

        if (!nombre) return;

        const response = await ProyectoService.createTareaPorActividadUuid(proyectoActivo.uuid, actividad.uuid, { nombre });
        const nuevaTarea = response.data;
        
        const nuevasTareas = [...(tareasPorActividad[actividad.uuid] || []), nuevaTarea];
        
        setTareasPorActividad((prev: any) => ({
            ...prev,
            [actividad.uuid]: nuevasTareas
        }));
        
        setNuevaTareaActividad((prev) => ({
            ...prev,
            [actividad.uuid]: ''
        }));
        
        // Actualizar caché
        updateTareasCache(proyectoActivo.uuid, actividad.uuid, nuevasTareas);
        
        // Actualizar avance de la actividad en el caché
        actualizarAvanceActividadEnCache(proyectoActivo.uuid, actividad.uuid);
        
        // Actualizar avance del proyecto en la lista
        actualizarAvanceProyectoEnLista(proyectoActivo.uuid);
    };

    const onKeyDownNuevaTareaActividad = async (e: any, actividad: any) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            await onAddNuevaTareaActividad(actividad);
        }
    };

    const onClickNuevaTareaActividad = async (_e: any, actividad: any) => {
        await onAddNuevaTareaActividad(actividad);
    };

    // Funciones para manejo de documentos
    const handleUploadDocumento = async (file: File, tipoDocumento: any) => {
        try {
            const formData = new FormData();
            formData.append('archivo', file);
            formData.append('tipo_documento_id', tipoDocumento.id);

            // Aquí deberías implementar la llamada a tu API para subir el archivo
            // const response = await DocumentoService.uploadDocument(formData);
            const response  =  await ProyectoService.createDocumentoPorActividadUuid(actividadSeleccionada.proyecto_uuid, actividadSeleccionada.uuid, formData);

            // Por ahora, simular la subida y actualizar el estado
            const nuevoDocumento = {
                id: Date.now(), // ID temporal
                nombre_original: file.name,
                size: file.size,
                tipo_documento: tipoDocumento,
                fecha_subida: new Date().toISOString(),
                url: URL.createObjectURL(file) // URL temporal para preview
            };

            // Actualizar el estado de la actividad seleccionada con el nuevo documento
            setActividadSeleccionada((prev: any) => ({
                ...prev,
                documentos: [...(prev.documentos || []), nuevoDocumento]
            }));

            showSuccess('Documento subido correctamente');
        } catch (error) {
            showError('Error al subir el documento');
        }
    };

    const handleDeleteDocumento = async (documento: any) => {
        try {
            
            await ProyectoService.deleteDocumentoPorActividadUuid(actividadSeleccionada.proyecto_uuid, actividadSeleccionada.uuid, documento.uuid);
        } catch (error) {
            throw error;
        }
    };

    const handleDownloadDocumento = (documento: any) => {
        try {

            //la api regresa un streamDownload
            ProyectoService.downloadDocumentoPorActividadUuid(actividadSeleccionada.proyecto_uuid, actividadSeleccionada.uuid, documento.uuid)
                .then((response) => {
                    const url = window.URL.createObjectURL(new Blob([response]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', documento.nombre_original);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                })
                .catch((error) => {
                   
                    showError('Error al descargar el documento');
                });
        } catch (error) {
            showError('Error al descargar el documento');
        }
    };

    // Custom templates 
    const headerPanelActividad = (options: any, data: any) => {
        const className = `${options.className} flex align-items-center gap-2`;
        const actividadCompletada = isActividadCompletada(data.uuid, proyectoActivo?.uuid);
        const avanceActividad = calcularAvanceActividad(data.uuid, proyectoActivo?.uuid);
        
        // Contar tareas solo si están cargadas desde el cache/estado local
        const tareasActuales = tareasPorActividad[data.uuid] || [];
        const totalTareasLocales = tareasActuales.length;
        const tareasCompletadasLocales = tareasActuales.filter((t: any) => t.estatus === 'Completada').length;
        const hayTareasCargadas = totalTareasLocales > 0;
        
        // Obtener datos del servidor si no hay tareas cargadas localmente
        const totalTareasServidor = data.total_tareas || 0;
        const tareasCompletadasServidor = data.tareas_completadas || 0;
        
        // Determinar qué datos usar para mostrar
        const totalTareas = hayTareasCargadas ? totalTareasLocales : totalTareasServidor;
        const tareasCompletadas = hayTareasCargadas ? tareasCompletadasLocales : tareasCompletadasServidor;
        
        return (
            <div className={className} style={{ flexWrap: 'nowrap' }}>
                {/* Contenedor del contenido principal - ocupa el espacio disponible */}
                <div className="flex align-items-center gap-2 flex-grow-1 overflow-hidden">
                    {actividadCompletada ? (
                        <div className="flex align-items-center gap-1" title="Actividad completada">
                            <i className="pi pi-check-circle text-green-600 flex-shrink-0"></i>
                        </div>
                    ) : (
                        <div className="flex align-items-center gap-1" 
                             title={`${tareasCompletadas}/${totalTareas} tareas completadas`}>
                            <i className="pi pi-clock text-orange-500 flex-shrink-0"></i>
                            <span className="text-xs text-orange-500 font-semibold flex-shrink-0">
                                {`${tareasCompletadas}/${totalTareas}`}
                            </span>
                        </div>
                    )}
                    <span className="font-bold text-ellipsis overflow-hidden whitespace-nowrap flex-grow-1" 
                          title={data.nombre}>
                        {data.nombre}
                    </span>
                    {!hayTareasCargadas && typeof data.porcentaje_avance === 'number' && (
                        <i className="pi pi-database text-xs text-gray-400 flex-shrink-0" 
                           title="Avance calculado por el servidor"></i>
                    )}
                    {hayTareasCargadas && (
                        <i className="pi pi-refresh text-xs text-green-500 flex-shrink-0" 
                           title="Avance en tiempo real"></i>
                    )}
                </div>
                
                {/* Contenedor de acciones - siempre permanece a la derecha */}
                <div className="flex align-items-center gap-2 flex-shrink-0">
                    <Button
                        icon="pi pi-folder-open"
                        rounded
                        text
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            setActividadSeleccionada(data);
                            setVisibleRepositorioDocumentos(true);
                        }}
                        tooltip="Documentos"
                        className="text-blue-600 hover:bg-blue-50"
                    />
                    <Button
                        icon={ data.uuid === actividadSeleccionada?.uuid ? "pi pi-eye" : "pi pi-eye-slash" }
                        rounded
                        text
                        size="small"
                        onClick={() => seleccionarActividad(data) }
                        tooltip='Ver detalles de actividad'
                        className={ data.uuid === actividadSeleccionada?.uuid ? "text-green-600 hover:bg-green-50" : "text-surface-600" }
                    />
                    {options.togglerElement}
                </div>
            </div>
        );
    }

    // Template para DataScroller de proyectos
    const proyectoTemplate = (proyecto: any) => {
        const avanceProyecto = calcularAvanceProyecto(proyecto.uuid);
        const isActive = proyectoActivo.uuid === proyecto.uuid;
        
        return (
            <div
                key={proyecto.uuid}
                onClick={() => onSelectProyecto(proyecto)}
                className={`mx-3 mb-3 p-4 border-round-lg border-1 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isActive
                        ? 'bg-primary-50 dark:bg-primary-900 border-primary-200 dark:border-primary-700 shadow-md' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
                <div className="flex align-items-start gap-3">
                    <div className={`flex align-items-center justify-content-center w-3rem h-3rem border-round-md ${
                        isActive ? 'bg-primary-100 dark:bg-primary-800' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                        <i className={`pi pi-bookmark text-xl ${
                            isActive ? 'text-primary-600' : 'text-gray-500'
                        }`}></i>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex align-items-start justify-content-between mb-2">
                            <h4 className={`text-lg font-semibold mb-1 line-height-3 ${
                                isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                            }`}>
                                {proyecto.nombre}
                            </h4>
                            <div className="flex align-items-center gap-1 ml-2">
                                {isActive && (
                                    <i className="pi pi-chevron-down text-primary-600 animation-duration-200"></i>
                                )}
                                {!isActive && (
                                    <i className="pi pi-chevron-right text-gray-400"></i>
                                )}
                            </div>
                        </div>
                        
                        {proyecto.descripcion && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-height-3 mb-3 overflow-hidden"
                               style={{ 
                                   display: '-webkit-box',
                                   WebkitLineClamp: 2,
                                   WebkitBoxOrient: 'vertical'
                               }}>
                                {proyecto.descripcion}
                            </p>
                        )}
                        
                        <div className="mb-3">
                            <div className="flex align-items-center justify-content-between mb-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Progreso
                                </span>
                                <div className="flex align-items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        {avanceProyecto}%
                                    </span>
                                    {proyecto.uuid !== proyectoActivo?.uuid && typeof proyecto.porcentaje_avance === 'number' && (
                                        <i className="pi pi-database text-xs text-gray-400" title="Avance calculado por el servidor"></i>
                                    )}
                                    {proyecto.uuid === proyectoActivo?.uuid && (
                                        <i className="pi pi-refresh text-xs text-green-500" title="Avance en tiempo real"></i>
                                    )}
                                </div>
                            </div>
                            <ProgressBar 
                                value={avanceProyecto} 
                                showValue={false}
                                style={{ height: '8px' }}
                                className={`border-round ${isActive ? 'opacity-100' : 'opacity-80'}`}
                            />
                        </div>
                        
                        <div className="flex align-items-center justify-content-between">
                            <div className="flex align-items-center gap-2">
                                {proyecto.tipo_proyecto_nombre && (
                                    <Tag 
                                        value={proyecto.tipo_proyecto_nombre} 
                                        severity="info" 
                                        className="text-xs px-2 py-1"
                                    />
                                )}
                                {proyecto.departamento_nombre && (
                                    <Tag 
                                        value={proyecto.departamento_nombre} 
                                        severity="warning" 
                                        className="text-xs px-2 py-1"
                                    />
                                )}
                            </div>
                            
                            {isActive && (
                                <div className="flex align-items-center gap-1 text-primary-600">
                                    <i className="pi pi-eye text-sm"></i>
                                    <span className="text-xs font-medium">Activo</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Breadcrumb items
    const breadcrumbItems: MenuItem[] = [
        { label: 'Gestión de proyectos', icon: 'pi pi-briefcase' },
        { label: 'Proyectos', icon: 'pi pi-briefcase' }
    ];
    const breadcrumbHome: MenuItem = { icon: 'pi pi-home', command: () => window.location.href = '/' };

    return (
        <div className="grid">
          <div className="col-12">
            <div className="mb-4 p-4 border-round-lg bg-gradient-to-r from-purple-50 to-violet-50 border-1 border-purple-100 shadow-2">
              <style>{`
                .custom-breadcrumb-proyectos .p-breadcrumb-list .p-breadcrumb-item .p-breadcrumb-item-link {
                  color: #6b21a8 !important;
                  text-decoration: none;
                }
                .custom-breadcrumb-proyectos .p-breadcrumb-list .p-breadcrumb-item .p-breadcrumb-item-link:hover {
                  color: #7c3aed !important;
                }
                .custom-breadcrumb-proyectos .p-breadcrumb-list .p-breadcrumb-separator {
                  color: #64748b !important;
                }
                .custom-breadcrumb-proyectos .p-breadcrumb-list .p-breadcrumb-item .p-breadcrumb-item-icon {
                  color: #8b5cf6 !important;
                }
              `}</style>
              <BreadCrumb 
                model={breadcrumbItems} 
                home={breadcrumbHome}
                className="custom-breadcrumb-proyectos bg-transparent border-none p-0"
              />
              <div className="mt-3">
                <h5 className="font-bold text-purple-800 m-0 flex align-items-center gap-2">
                  <i className="pi pi-briefcase text-purple-600"></i>
                  Gestión de Proyectos
                </h5>
                <p className="text-sm text-purple-600 m-0 mt-1">Administra y supervisa todos los proyectos activos</p>
              </div>
            </div>
          </div>
          {proyectos.length === 0 && !loading ? (
            <EmptyStateProject onAddProject={onAgregar} />
          ) : (
            <>
              <div className="col-12 md:col-4">
                <div className="w-full bg-white border border-gray-200 border-round shadow-8 md:shadow-1 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center py-4 px-4 justify-content-center border-bottom-1 border-gray-200 dark:border-gray-700">
                        <Button icon="pi pi-plus" label='Agregar proyecto' onClick={onAgregar}></Button>
                    </div>
                    <DataScroller
                        value={proyectos}
                        emptyMessage="No hay proyectos disponibles"
                        itemTemplate={proyectoTemplate}
                        rows={perPage}
                        inline
                        pt={{
                            content: { className: 'border-none' },
                            item: { className: 'border-none' }
                        }}
                        scrollHeight="calc(85vh - 80px)"
                        header={
                            <div className="flex align-items-center justify-content-between p-3 bg-gray-50 dark:bg-gray-900 border-bottom-1 border-gray-200 dark:border-gray-700">
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-list text-primary-600"></i>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        Proyectos ({proyectos.length})
                                    </span>
                                </div>
                                {proyectos.length > 0 && (
                                    <Tag 
                                        value={hasMore ? 'Más disponibles' : 'Todos cargados'} 
                                        severity={hasMore ? 'warning' : 'success'}
                                        className="text-xs"
                                    />
                                )}
                            </div>
                        }
                        footer={
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-top-1 border-gray-200 dark:border-gray-700">
                                {loading && (
                                    <div className="flex align-items-center justify-content-center gap-2 py-2">
                                        <ProgressSpinner style={{width: '20px', height: '20px'}} strokeWidth="4" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Cargando proyectos...</span>
                                    </div>
                                )}
                                {!loading && hasMore && proyectos.length > 0 && (
                                    <Button 
                                        label={`Cargar más proyectos (${proyectos.length} de muchos)`}
                                        icon="pi pi-angle-down"
                                        outlined
                                        onClick={loadMoreProyectos}
                                        className="w-full"
                                    />
                                )}
                                {!hasMore && proyectos.length > 0 && (
                                    <div className="text-center py-2">
                                        <div className="flex align-items-center justify-content-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <i className="pi pi-check-circle text-green-500"></i>
                                            <span>Todos los proyectos han sido cargados ({proyectos.length} total)</span>
                                        </div>
                                    </div>
                                )}
                                {!loading && proyectos.length === 0 && (
                                    <div className="text-center py-6">
                                        <div className="mb-4">
                                            <i className="pi pi-folder-open text-6xl text-gray-300 dark:text-gray-600"></i>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            No hay proyectos disponibles
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            Comienza creando tu primer proyecto para organizar tus actividades
                                        </p>
                                        <Button 
                                            label="Crear primer proyecto" 
                                            icon="pi pi-plus"
                                            onClick={onAgregar}
                                            size="small"
                                        />
                                    </div>
                                )}
                            </div>
                        }
                        className="border-none"
                    />
                </div>
              </div>
              <div className={`col-12 ${(openPanelProyecto || openPanelActividad) && showDetailPanel ? 'md:col-4' : 'md:col-8'}`}>
                {(proyectoActivo.uuid && !loadingActividadesProyecto) && (
                    <div className="w-full max-w-md bg-white border-round-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex flex-column gap-3 p-4 border-bottom-1 surface-border">
                            <div className="flex align-items-center justify-content-between w-full">
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-list text-primary text-xl"></i>
                                    <h2 className="m-0 text-primary font-semibold text-xl">Actividades</h2>
                                </div>
                                <div className="flex align-items-center gap-3">
                                    <div className="flex align-items-center gap-2 px-3 py-1 border-round bg-primary-50 dark:bg-primary-900">
                                        <span className="text-sm text-primary-700 dark:text-primary-100">
                                            {actividades.filter((act: any) => isActividadCompletada(act.uuid, proyectoActivo?.uuid)).length}/{actividades.length}
                                        </span>
                                        <div className="text-lg font-bold text-primary-800 dark:text-primary-200">
                                            {calcularAvanceProyecto()}%
                                        </div>
                                    </div>
                                    {(openPanelProyecto || openPanelActividad) && (
                                        <Button 
                                            tooltipOptions={{ position: 'left' }}
                                            tooltip={showDetailPanel ? "Ocultar panel de detalles" : "Mostrar panel de detalles"}
                                            icon={showDetailPanel ? "pi pi-angle-double-right" : "pi pi-angle-double-left"} 
                                            outlined 
                                            onClick={() => setShowDetailPanel(!showDetailPanel)}
                                            className="p-button-sm"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="w-full">
                                <ProgressBar 
                                    value={calcularAvanceProyecto()} 
                                    showValue={false}
                                    style={{ height: '6px' }}
                                    className="w-full"
                                />
                            </div>
                            <Button 
                                icon="pi pi-plus" 
                                label='Agregar actividad' 
                                onClick={onAgregarActividad}
                                className="p-button-primary p-button-outlined align-self-start"
                            />
                        </div>
                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(95vh-180px)' }}>
                            {actividades.length === 0 && (
                                <div className="flex flex-column align-items-center justify-content-center gap-3 p-6">
                                    <i className="pi pi-list text-6xl text-gray-300 dark:text-gray-600"></i>
                                    <p className="text-gray-600 dark:text-gray-400 text-center">
                                        No hay actividades registradas para este proyecto.<br/>
                                        <span className="text-sm">Comienza agregando una nueva actividad.</span>
                                    </p>
                                </div>
                            )}
                            {actividades.map((actividad:any) => (
                                <Panel
                                    toggleable
                                    collapsed={actividadCollapsed[actividad.uuid] !== undefined ? actividadCollapsed[actividad.uuid] : true}
                                    headerTemplate={(options) => headerPanelActividad(options, actividad)}
                                    expandIcon="pi pi-chevron-down"
                                    collapseIcon="pi pi-chevron-up"
                                    key={actividad.uuid}
                                    className='mx-2 my-2 shadow-1 border-round-lg'
                                    pt={{
                                        header: { className: 'p-3' },
                                        content: { className: 'px-3 py-2' },
                                        root: { className: 'border-none' }
                                    }}
                                    onToggle={(e) => onTogglePanelActividad(e, actividad)} 
                                >
                                    <div key={actividad.uuid}>
                                        <ul className='list-none p-0 m-0 flex flex-column gap-2'>
                                            {(tareasPorActividad[actividad.uuid] || []).map((tarea: any) => (
                                                <li key={tarea.id} className="flex align-items-center gap-2 p-2 border-round hover:surface-100 transition-colors transition-duration-150">
                                                    <Checkbox   
                                                        checked={tarea.estatus === 'Completada'}
                                                        onChange={() => onChangeEstatusActividad(actividad, tarea)}
                                                        className="flex align-items-center justify-content-center"
                                                    />
                                                    {tarea.editing ? (
                                                        <InputText
                                                            name={`nombre-${tarea.id}`}
                                                            id={`nombre-${tarea.id}`}
                                                            value={tarea.nombre}
                                                            autoFocus
                                                            onBlur={async (e) => onBlurTareaActividad(e, actividad, tarea)}
                                                            onKeyDown={async (e) => onKeyDownTareaActividad(e, actividad, tarea)}
                                                            onChange={(e) => onChangeTareaActividad(e, actividad, tarea)}
                                                            className="flex-1"
                                                        />
                                                    ) : (
                                                        <span
                                                            className={`flex-1 cursor-pointer ${tarea.estatus === 'Completada' ? 'line-through text-gray-500' : ''}`}
                                                            onDoubleClick={(e) => onDoubleClickTareaActividad(e, actividad, tarea)}
                                                        >
                                                            {tarea.nombre}
                                                        </span>
                                                    )}
                                                    <Button
                                                        icon="pi pi-times"
                                                        severity="danger"
                                                        rounded
                                                        text
                                                        size="small"
                                                        onClick={() => onDeleteTareaActividad(actividad, tarea)}
                                                    />
                                                </li>
                                            ))}
                                            {loadingTareasActividad[actividad.uuid] === false && (
                                                <li className="flex items-center gap-2 p-2">
                                                    <InputText
                                                        placeholder="Nueva tarea..."
                                                        name={`nuevaTareaNombre-${actividad.uuid}`}
                                                        id={`nuevaTareaNombre-${actividad.uuid}`}
                                                        value={nuevaTareaActividad[actividad.uuid] || ''}
                                                        onChange={(e) => onChangeNuevaTareaActividad(e, actividad)}
                                                        onKeyDown={(e) => onKeyDownNuevaTareaActividad(e, actividad)}
                                                        autoFocus
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        icon="pi pi-plus"
                                                        severity="success"
                                                        rounded
                                                        text
                                                        size="small"
                                                        onClick={(e) => onClickNuevaTareaActividad(e, actividad)}
                                                    />
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </Panel> 
                            ))}
                        </div>
                    </div>)
                } 
                {(!proyectoActivo.uuid && !loadingActividadesProyecto) && (
                    <EmptyStateActivity />
                )}
                {loadingActividadesProyecto && (
                    <div className="loading-overlay h-full flex justify-content-center align-items-center">
                        <ProgressSpinner />
                    </div>
                )}
              </div>
              {(openPanelProyecto || openPanelActividad) && showDetailPanel && (
                <div className='col-12 md:col-4'>
                    { (actividadSeleccionada.uuid && openPanelActividad) && (
                        <div className="w-full max-w-md bg-white border-round-lg shadow-md dark:bg-gray-800">
                            <div className="p-4 border-bottom-1 surface-border">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <h2 className="text-xl font-bold m-0 text-primary">{actividadSeleccionada.nombre}</h2>
                                    <Tag value={actividadSeleccionada.prioridad} 
                                        severity={
                                            actividadSeleccionada.prioridad === 'Alta' 
                                            ? 'danger' 
                                            : actividadSeleccionada.prioridad === 'Media' 
                                            ? 'warning' 
                                            : 'info'
                                        } 
                                    />
                                </div>
                            </div>
                            
                            <div className="p-4">
                                {/* People Section */}
                                <div className="mb-3">
                                    <h3 className="text-sm uppercase text-gray-600 dark:text-gray-400 mb-3">Participantes</h3>
                                    <div className="grid">
                                        <div className="col-12 mb-2">
                                            <div className="flex align-items-center gap-2">
                                                <Avatar label="R" shape="circle" size="normal" className="bg-primary-100 text-primary-700"/>
                                                <div className="flex flex-column">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Responsable</span>
                                                    <span className="font-medium">{actividadSeleccionada.responsable_nombre}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12 mb-2">
                                            <div className="flex align-items-center gap-2">
                                                <Avatar label="C" shape="circle" size="normal" className="bg-orange-100 text-orange-700"/>
                                                <div className="flex flex-column">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Capacitador</span>
                                                    <span className="font-medium">{actividadSeleccionada.capacitador_nombre}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="flex align-items-center gap-2">
                                                <Avatar label="B" shape="circle" size="normal" className="bg-green-100 text-green-700"/>
                                                <div className="flex flex-column">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Beneficiario</span>
                                                    <span className="font-medium">{actividadSeleccionada.beneficiario_nombre}</span>
                                                </div>
                                            </div>
                                            {(actividadSeleccionada.persona_beneficiada && Array.isArray(actividadSeleccionada.persona_beneficiada)) && 
                                                (
                                                    <div className="flex flex-column gap-2 py-1 ml-2">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400 mt-2">Número de beneficiarios por tipo</span>
                                                        <div className="flex flex-auto flex-wrap gap-2 ">
                                                            {actividadSeleccionada.persona_beneficiada.map((persona:any, index: number) => (
                                                            <div className="flex align-items-center gap-2">
                                                                <span className="font-medium text-gray-600 dark:text-gray-400">{persona.nombre === 'Mujer' ? `Mujer(es)` : `${persona.nombre}(s)` }</span>
                                                                <Badge  value={persona.total} severity="info"></Badge>
                                                            </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                   
                                                )}
                                        </div>
                                    </div>
                                </div>

                                {/* Details Section */}
                                <div className="mb-3">
                                    <h3 className="text-sm uppercase text-gray-600 dark:text-gray-400 mb-3">Detalles</h3>
                                    <div className="grid">
                                        <div className="col-12 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Tipo de actividad</span>
                                            <span className="font-medium">{actividadSeleccionada.tipo_actividad_nombre}</span>
                                        </div>
                                        <div className="col-12 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Prioridad</span>
                                            <span className="font-medium">{actividadSeleccionada.prioridad}</span>
                                        </div>
                                        <div className="col-12 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Registro NAFIN</span>
                                            <span className="font-medium">{actividadSeleccionada.registro_nafin || 'No disponible'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dates Section */}
                                <div className="mb-3">
                                    <h3 className="text-sm uppercase text-gray-600 dark:text-gray-400 mb-3">Fechas</h3>
                                    <div className="grid">
                                        <div className="col-6 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                <i className="pi pi-calendar text-primary mr-2"></i>Inicio
                                            </span>
                                            <span className="font-medium">
                                                {actividadSeleccionada.fecha_inicio ? new Date(actividadSeleccionada.fecha_inicio).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                }).replace('.', '') : 'No disponible'}
                                            </span>
                                        </div>
                                        <div className="col-6 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                <i className="pi pi-flag text-danger mr-2"></i>Fin
                                            </span>
                                            <span className="font-medium">
                                                {actividadSeleccionada.fecha_fin ? new Date(actividadSeleccionada.fecha_fin).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                }).replace('.', '') : 'No disponible'}
                                            </span>
                                        </div>
                                        <div className="col-6 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Fecha solicitud constancia</span>
                                            <span className="font-medium">{actividadSeleccionada.fecha_solicitud_constancia ? new Date(actividadSeleccionada.fecha_solicitud_constancia).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '') : 'No disponible'}</span>
                                        </div>
                                        <div className="col-6 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Fecha envío constancia</span>
                                            <span className="font-medium">{actividadSeleccionada.fecha_envio_constancia ? new Date(actividadSeleccionada.fecha_envio_constancia).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '') : 'No disponible'}</span>
                                        </div>
                                        <div className="col-6 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Fecha vencimiento envío encuesta</span>
                                            <span className="font-medium">{actividadSeleccionada.fecha_vencimiento_envio_encuesta ? new Date(actividadSeleccionada.fecha_vencimiento_envio_encuesta).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '') : 'No disponible'}</span>
                                        </div>
                                        <div className="col-6 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Fecha envío encuesta</span>
                                            <span className="font-medium">{actividadSeleccionada.fecha_envio_encuesta ? new Date(actividadSeleccionada.fecha_envio_encuesta).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '') : 'No disponible'}</span>
                                        </div>
                                        <div className="col-6 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Fecha inicio difusión banner</span>
                                            <span className="font-medium">{actividadSeleccionada.fecha_inicio_difusion_banner ? new Date(actividadSeleccionada.fecha_inicio_difusion_banner).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '') : 'No disponible'}</span>
                                        </div>
                                        <div className="col-6 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Fecha fin difusión banner</span>
                                            <span className="font-medium">{actividadSeleccionada.fecha_fin_difusion_banner ? new Date(actividadSeleccionada.fecha_fin_difusion_banner).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '') : 'No disponible'}</span>
                                        </div>
                                    </div>
 </div>

                                {/* Links Section */}
                                <div className="mb-3">
                                    <h3 className="text-sm uppercase text-gray-600 dark:text-gray-400 mb-3">Enlaces</h3>
                                    <div className="grid">
                                        <div className="col-4">
                                            <Button
                                                label="Zoom"
                                                icon="pi pi-video"
                                                disabled={!actividadSeleccionada.link_zoom}
                                                onClick={() => window.open(actividadSeleccionada.link_zoom, '_blank', 'noopener,noreferrer')}
                                                className="p-button-outlined p-button-rounded w-full"
                                            />
                                        </div>
                                        <div className="col-4">
                                            <Button
                                                label="Registro"
                                                icon="pi pi-user-plus"
                                                disabled={!actividadSeleccionada.link_registro}
                                                onClick={() => window.open(actividadSeleccionada.link_registro, '_blank', 'noopener,noreferrer')}
                                                className="p-button-outlined p-button-rounded w-full"
                                            />
                                        </div>
                                        <div className="col-4">
                                            <Button
                                                label="Panelista"
                                                icon="pi pi-users"
                                                disabled={!actividadSeleccionada.link_panelista}
                                                onClick={() => window.open(actividadSeleccionada.link_panelista, '_blank', 'noopener,noreferrer')}
                                                className="p-button-outlined p-button-rounded w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Section */}
                                <div className="border-top-1 surface-border pt-4">
                                    <div className="grid">
                                        <div className="col-6">
                                            <Button 
                                                icon="pi pi-trash" 
                                                severity="danger" 
                                                label="Eliminar" 
                                                className="p-button-outlined w-full"
                                                onClick={(event) => onDeleteActividad(event, { itemData: actividadSeleccionada })}
                                            />
                                        </div>
                                        <div className="col-6">
                                            <Button 
                                                icon="pi pi-pencil" 
                                                severity="warning" 
                                                label="Editar"
                                                className="p-button-outlined w-full" 
                                                onClick={() => onEditActividad({ item: { itemData: actividadSeleccionada }})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )
                    }
                    {(proyectoActivo.uuid && openPanelProyecto && !openPanelActividad && !loadingActividadesProyecto) && (
                        <div className="w-full max-w-md bg-white border-round-lg shadow-md dark:bg-gray-800">
                            <div className="p-4 border-bottom-1 surface-border">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <h2 className="text-xl font-bold m-0 text-primary">{proyectoActivo.nombre}</h2>
                                </div>
                            </div>
                            
                            <div className="p-4">
                                {/* Project Progress Section */}
                                <div className="mb-4">
                                    <h3 className="text-sm uppercase text-gray-600 dark:text-gray-400 mb-3">Progreso del Proyecto</h3>
                                    <div className="flex align-items-center justify-content-between mb-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            {actividades.filter((act: any) => isActividadCompletada(act.uuid, proyectoActivo?.uuid)).length}/{actividades.length} actividades completadas
                                        </span>
                                        <span className="text-lg font-bold text-primary-600">
                                            {calcularAvanceProyecto()}%
                                        </span>
                                    </div>
                                    <ProgressBar 
                                        value={calcularAvanceProyecto()} 
                                        showValue={false}
                                        style={{ height: '8px' }}
                                    />
                                </div>

                                {/* Project Details Section */}
                                <div className="mb-4">
                                    <h3 className="text-sm uppercase text-gray-600 dark:text-gray-400 mb-3">Detalles del Proyecto</h3>
                                    <div className="grid">
                                        <div className="col-12 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                <i className="pi pi-tag text-primary-600 mr-2"></i>Tipo de proyecto
                                            </span>
                                            <span className="font-medium">{ proyectoActivo.tipo_proyecto_nombre }</span>
                                        </div>
                                        <div className="col-12 mb-3">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                <i className="pi pi-building text-orange-500 mr-2"></i>Departamento
                                            </span>
                                            <span className="font-medium">{ proyectoActivo.departamento_nombre }</span>
                                        </div>
                                        <div className="col-12">
                                            <span className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                <i className="pi pi-file-edit text-green-500 mr-2"></i>Descripción
                                            </span>
                                            <p className="font-medium m-0">{ proyectoActivo.descripcion }</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Summary Section */}
                                <div className="mb-4">
                                    <h3 className="text-sm uppercase text-gray-600 dark:text-gray-400 mb-3">Resumen de Actividades</h3>
                                    <div className="grid">
                                        <div className="col-6">
                                            <div className="p-3 border-round bg-primary-50 dark:bg-primary-900">
                                                <div className="text-sm text-primary-600 mb-1">Total</div>
                                                <div className="text-xl font-bold text-primary-700">{actividades.length}</div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="p-3 border-round bg-green-50 dark:bg-green-900">
                                                <div className="text-sm text-green-600 mb-1">Completadas</div>
                                                <div className="text-xl font-bold text-green-700">
                                                    {actividades.filter((act: any) => isActividadCompletada(act.uuid, proyectoActivo?.uuid)).length}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Section */}
                                <div className="border-top-1 surface-border pt-4 flex justify-content-between gap-2">
                                    <Button 
                                        icon="pi pi-trash" 
                                        severity="danger" 
                                        label="Eliminar"
                                        className="p-button-outlined"
                                        loading={deletingRows[proyectoActivo.uuid] || false}
                                        onClick={(event) => handleDelete(event, { data: proyectoActivo })}
                                    />
                                    <Button 
                                        icon="pi pi-pencil" 
                                        severity="warning" 
                                        label="Editar"
                                        className="p-button-outlined"
                                        onClick={() => onEditProyecto({ data: proyectoActivo })}
                                    />
                                </div>
                            </div>
                        </div>  
                    )}
                </div>)
               }

               
            </>
          )}
           <FormularioProyecto 
                        visible={visibleFormulario}
                        onHide={() => setVisibleFormulario(false)}
                        initialData={formularioProyecto}
                        onSave={handleSaveData}
                        loading={loadingGuardar}
                        errors={formularioErrors}
                        setFieldValue={(field, value) => {
                            handleFormularioChange({
                                target: {
                                    name: field,
                                    value: value
                                }
                            });
                        }}
                        tiposProyecto={tiposProyecto}
                        departamentos={departamentos}
                />
                <FormularioActividad 
                        visible={visibleFormularioActividad} 
                        onHide={() => setVisibleFormularioActividad(false)} 
                        initialData={formularioActividad} 
                        onSave={handleSaveDataActividad} 
                        loading={loadingGuardarActividad} 
                        errors={formularioActividadErrors}
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
                    
                <RepositorioDocumentos
                        visible={visibleRepositorioDocumentos}
                        onHide={() => setVisibleRepositorioDocumentos(false)}
                        actividad={actividadSeleccionada}
                        tiposDocumento={tiposDocumento}
                        onUploadDocument={handleUploadDocumento}
                        onDeleteDocument={handleDeleteDocumento}
                        onDownloadDocument={handleDownloadDocumento}
                    />
        </div>
    );
};

export default ProyectoPage;
