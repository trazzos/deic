import http from "@/src/lib/axios";

export const TipoProyectoService = {

    getListTipoProyecto() {
        return http.get(`/api/tipos-proyecto`);
    },
    
    createTipoProyecto(data: any): Promise<any> {
        return http.post(`/api/tipos-proyecto`, data);
    },

    updateTipoProyecto(id: number, data: any): Promise<any> {
        return http.put(`/api/tipos-proyecto/${id}`, data);
    },

    deleteTipoProyecto(id: number): Promise<any> {
        return http.delete(`/api/tipos-proyecto/${id}`);
    },
   

};
