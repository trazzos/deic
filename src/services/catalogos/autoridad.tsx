import http from "@/src/lib/axios";
import { create } from "domain";

export const AutoridadService = {

    getListAutoridad() {
        return http.get(`/api/autoridades`);
    },
    
    createAutoridad(data: any): Promise<any> {
        return http.post(`/api/autoridades`, data);
    },

    updateAutoridad(id: number, data: any): Promise<any> {
        return http.put(`/api/autoridades/${id}`, data);
    },

    deleteAutoridad(id: number): Promise<any> {
        return http.delete(`/api/autoridades/${id}`);
    },
   

};
