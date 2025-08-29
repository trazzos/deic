export interface Persona {
    id: number;
    dependencia_type: 'Secretaria' | 'Subsecretaria' | 'Direccion' | 'Departamento' | null;
    dependencia_id: number | null;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string
    es_titular?: string;
    nombre_dependencia?: string;
    email: string | null;
    cuenta_activa?: boolean;     
    password: string | null;
    password_confirmation: string | null;
}
export interface Usuario {
    email: string | null;     
    password: string | null;
    roles: string[] | null;
    password_confirmation: string | null;

}

export default {
    Persona, 
    Usuario,
}