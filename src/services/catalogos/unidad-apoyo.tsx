import http from "@/src/lib/axios";

export const UnidadApoyoService = {

    getListUnidadApoyo() {
        return http.get(`/api/unidades-apoyo`);
    },

    createUnidadApoyo(data: any): Promise<any> {
        return http.post(`/api/unidades-apoyo`, data);
    },

    updateUnidadApoyo(id: number, data: any): Promise<any> {
        return http.put(`/api/unidades-apoyo/${id}`, data);
    },

    deleteUnidadApoyo(id: number): Promise<any> {
        return http.delete(`/api/unidades-apoyo/${id}`);
    },

};