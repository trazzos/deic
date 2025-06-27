import http from "@/src/lib/axios";

export const TipoActividadService = {

    getListTipoActividad() {
        return http.get(`/api/tipos-actividad`);
    },
    
    createTipoActividad(data: any): Promise<any> {
        return http.post(`/api/tipos-actividad`, data);
    },

    updateTipoActividad(id: number, data: any): Promise<any> {
        return http.put(`/api/tipos-actividad/${id}`, data);
    },

    deleteTipoActividad(id: number): Promise<any> {
        return http.delete(`/api/tipos-actividad/${id}`);
    },
   

};
