export interface Persona {
    id: number;
    departamento_id: number | null;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string
    responsable_departamento:string;
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