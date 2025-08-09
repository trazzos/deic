interface BaseCatalogo {
    id?: number;
    nombre: string;
    descripcion?: string;
}

export interface Autoridad extends BaseCatalogo {}
export interface Beneficiario extends BaseCatalogo {}
export interface Capacitador extends BaseCatalogo {}
export interface Departamento extends BaseCatalogo {}
export interface TipoActividad extends BaseCatalogo {}
export interface TipoDocumento extends BaseCatalogo {}
export interface TipoProyecto extends BaseCatalogo {}