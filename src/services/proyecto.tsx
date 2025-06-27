import http from "@/src/lib/axios";

export const ProyectoService = {

    getListProyecto() {
        return http.get(`/api/proyectos`);
    },

     getProyecto(uuid: string): Promise<any> {
        return http.get(`/api/proyectos/${uuid}`);
    },
    
    createProyecto(data: any): Promise<any> {
        return http.post(`/api/proyectos`, data);
    },

    updateProyecto(uuid: string, data: any): Promise<any> {
        return http.patch(`/api/proyectos/${uuid}`, data);
    },

    deleteProyecto(uuid: string): Promise<any> {
        return http.delete(`/api/proyectos/${uuid}`);
    },

    getListaActividadesPorProyectoUuid(uuid:string) {
        return http.get(`/api/proyectos/${uuid}/actividades`);
    },

    createActividadPorProyectoUuid(uuid:string, contexto:any) {
        return http.post(`/api/proyectos/${uuid}/actividades`, contexto);
    },

    updateActividadPorProyectoUuid(uuid:string, contexto:any) {
        return http.patch(`/api/proyectos/actividades/${uuid}`, contexto);
    },

    deleteActividadPorProyecto(uuidActividad:string) {
        return http.delete(`/api/proyectos/actividades/${uuidActividad}`);
    },
   

};
