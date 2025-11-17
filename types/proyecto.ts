export interface Proyecto {
    uuid:string|null,
    tipoProyecto:number|null,
    departamento:number|null,
    nombre:string,
    descripcion:string,
    monto?:number|null
}