import http from "@/src/lib/axios";

export const ProyectoService = {

    getListProyecto() {
        return http.get(`/api/proyectos`);
    },

    paginateProyecto(page: number, perPage: number) {
        return http.get(`/api/proyectos/paginate`, {
            params: {
                page,
                perPage
            }
        });
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

    updateActividadPorProyectoUuid(uuidProyecto:string,uuidActividad:string, contexto:any) {
        return http.patch(`/api/proyectos/${uuidProyecto}/actividades/${uuidActividad}`, contexto);
    },

    deleteActividadPorProyecto(uuidProyecto:string, uuidActividad:string) {
        return http.delete(`/api/proyectos/${uuidProyecto}/actividades/${uuidActividad}`);
    },

    getListaTareasPorActividadUuid(proyectoUuid:string, actividadUuid:string) {
        return http.get(`/api/proyectos/${proyectoUuid}/actividades/${actividadUuid}/tareas`);
    },

    createTareaPorActividadUuid(proyectoUuid:string, actividadUuid:string, contexto:any) {
        return http.post(`/api/proyectos/${proyectoUuid}/actividades/${actividadUuid}/tareas`, contexto);
    },

    updateTareaPorActividadUuid(proyectoUuid:string, actividadUuid:string, id:number, contexto:any) {
        return http.patch(`/api/proyectos/${proyectoUuid}/actividades/${actividadUuid}/tareas/${id}`, contexto);
    },

    markAsCompleteTareaPorActividadUuid(proyectoUuid:string, actividadUuid:string, id:number) {
        return http.patch(`/api/proyectos/${proyectoUuid}/actividades/${actividadUuid}/tareas/${id}/completar`, {});
    },

    markAsPendingTareaPorActividadUuid(proyectoUuid:string, actividadUuid:string, id:number) {
        return http.patch(`/api/proyectos/${proyectoUuid}/actividades/${actividadUuid}/tareas/${id}/pendiente`, {});
    },

    deleteTareaPorActividadUuid(proyectoUuid:string, actividadUuid:string, id:number) {
        return http.delete(`/api/proyectos/${proyectoUuid}/actividades/${actividadUuid}/tareas/${id}`);
    },
    // creame los endpoints para los documentos de la actividad son los scope bindings que venimos usando en actividades
    getListaDocumentosPorActividadUuid(proyectoUuid:string, actividadUuid:string) {
        return http.get(`/api/proyectos/${proyectoUuid}/actividades/${actividadUuid}/archivos`);
    },
    createDocumentoPorActividadUuid(proyectoUuid:string, actividadUuid:string, contexto:any) {
        return http.post(`/api/proyectos/${proyectoUuid}/actividades/${actividadUuid}/archivos`, contexto);
    }, 
    deleteDocumentoPorActividadUuid(proyectoUuid:string, actividadUuid:string, uuid:string) {
        return http.delete(`/api/proyectos/${proyectoUuid}/actividades/${actividadUuid}/archivos/${uuid}`);
    }
};
