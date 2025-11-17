import * as Yup from 'yup';

export const schemaActividad = Yup.object().shape({
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

// Función para crear esquema dinámico basado en el tipo de proyecto
export const createSchemaProyecto = (tiposProyecto: any[], tipoProyectoId?: string | number) => {
    const tipoProyectoSeleccionado = tiposProyecto.find(tipo => tipo.id == tipoProyectoId);
    const esTipoInversion = tipoProyectoSeleccionado?.nombre?.toLowerCase().includes('inversión') || 
                           tipoProyectoSeleccionado?.nombre?.toLowerCase().includes('inversion');

    return Yup.object().shape({
        tipoProyecto: Yup.string().required('El tipo de proyecto es obligatorio'),
        departamento: Yup.string().required('El departamento es obligatorio'),
        nombre: Yup.string().required('El nombre es obligatorio'),
        descripcion: Yup.string().required('La descripción es obligatoria'),
        monto: esTipoInversion 
            ? Yup.number()
                .required('El monto es obligatorio para proyectos de inversión')
                .min(0.01, 'El monto debe ser mayor a 0')
                .typeError('El monto debe ser un número válido')
            : Yup.number()
                .nullable()
                .transform((value, originalValue) => originalValue === '' ? null : value)
                .min(0, 'El monto no puede ser negativo')
                .typeError('El monto debe ser un número válido')
    });
};

// Esquema base para compatibilidad hacia atrás
export const schemaProyecto = Yup.object().shape({
    tipoProyecto: Yup.string().required('El tipo de proyecto es obligatorio'),
    departamento: Yup.string().required('El departamento es obligatorio'),
    nombre: Yup.string().required('El nombre es obligatorio'),
    descripcion: Yup.string().required('La descripción es obligatoria'),
    monto: Yup.number()
        .nullable()
        .transform((value, originalValue) => originalValue === '' ? null : value)
        .min(0, 'El monto no puede ser negativo')
        .typeError('El monto debe ser un número válido')
});

const proyectoSchema = {
    schemaProyecto,
    schemaActividad
};

export default proyectoSchema;
