import * as Yup from 'yup';

export const formularioSchema = Yup.object().shape({
    dependencia_type: Yup.string().required('El tipo de dependencia es obligatorio'),
    secretaria_id: Yup.number().when('dependencia_type', {
        is: (val: string) => val === 'Secretaria' || val === 'Unidad de Apoyo',
        then: (schema) => schema.required('La secretaría es obligatoria'),
        otherwise: (schema) => schema.nullable(),
    }),
    unidad_apoyo_id: Yup.number().when('dependencia_type', {
        is: 'Unidad de Apoyo',
        then: (schema) => schema.required('La unidad de apoyo es obligatoria'),
        otherwise: (schema) => schema.nullable(),
    }),
    subsecretaria_id: Yup.number().when('dependencia_type', {
        is: 'Subsecretaria',
        then: (schema) => schema.required('La subsecretaría es obligatoria'),
        otherwise: (schema) => schema.nullable(),
    }),
    direccion_id: Yup.number().when('dependencia_type', {
        is: 'Direccion',
        then: (schema) => schema.required('La dirección es obligatoria'),
        otherwise: (schema) => schema.nullable(),
    }),
    departamento_id: Yup.number().when('dependencia_type', {
        is: 'Departamento',
        then: (schema) => schema.required('El departamento es obligatorio'),
        otherwise: (schema) => schema.nullable(),
    }),
    dependencia_id: Yup.number().required('La dependencia es obligatoria'),
    nombre: Yup.string().required('El nombre es obligatorio'),
    apellido_paterno: Yup.string().required('El apellido paterno es obligatorio'),
    apellido_materno: Yup.string().required('El apellido materno es obligatorio'),
    es_titular: Yup.string().required('El ¿Es titular? es obligatorio'),
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

export const usuarioSchema = Yup.object().shape({
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
})

const personaSchema = {
    formularioSchema,
    usuarioSchema
}

export default personaSchema