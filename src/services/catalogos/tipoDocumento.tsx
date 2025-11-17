import http from "@/src/lib/axios";

export const TipoDocumentoService = {

    getListTipoDocumento() {
        return http.get(`/api/tipos-documento`);
    },
    
    createTipoDocumento(data: any): Promise<any> {
        return http.post(`/api/tipos-documento`, data);
    },

    updateTipoDocumento(id: number, data: any): Promise<any> {
        return http.put(`/api/tipos-documento/${id}`, data);
    },

    deleteTipoDocumento(id: number): Promise<any> {
        return http.delete(`/api/tipos-documento/${id}`);
    },
   

};
