interface ReporteBeneficiado {
    nombre: string;
    total: number;
}

interface TipoProyecto {
    id: number;
    nombre: string;
    descripcion: ?string;
}

interface Estadistica {
    total_actividades:number,
    actividades_completadas:number,
    actividades_pendientes:number,
    actividades_iniciadas:number,
    porcentaje_completado:number,
    porcentaje_pendiente:number,
    porcentaje_iniciado:number
}


export interface ReporteTipoProyecto {
    tipo_proyecto: TipoProyecto;
    estadisticas: Estadistica;
    beneficiados: any
}
export interface ReporteProyecto {
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

export interface ActividadReporte {
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
    estatus: 'Pendiente' | 'En Progreso' | 'Completada' | 'Cancelada';
}

export interface FiltrosReporte {
    fecha_inicio: Date | null;
    fecha_fin: Date | null;
    tipo_proyecto_id: any;
    estatus: any;
}

export interface DetalleProyecto {
    uuid: string;
    nombre: string;
    descripcion: string;
    tipo_proyecto: string;
    departamento: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    porcentaje_avance: number;
    responsable: string;
    actividades: ActividadDetalle[];
}

export interface ActividadDetalle {
    uuid: string;
    nombre: string;
    descripcion: string;
    tipo_actividad: string;
    capacitador: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    porcentaje_avance: number;
    beneficiados: number;
    proyectado: number;
    alcanzado: number;
    estatus: 'Pendiente' | 'En Progreso' | 'Completada' | 'Cancelada';
    tareas: TareaDetalle[];
}

export interface TareaDetalle {
    id: number;
    nombre: string;
    descripcion: string;
    completada: boolean;
    fecha_completada?: Date;
}
