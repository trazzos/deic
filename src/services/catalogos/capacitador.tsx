import http from "@/src/lib/axios";

export const CapacitadorService = {

    getListCapacitador() {
        return http.get(`/api/capacitadores`);
    },
    
    createCapacitador(data: any): Promise<any> {
        return http.post(`/api/capacitadores`, data);
    },

    updateCapacitador(id: number, data: any): Promise<any> {
        return http.put(`/api/capacitadores/${id}`, data);
    },

    deleteCapacitador(id: number): Promise<any> {
        return http.delete(`/api/capacitadores/${id}`);
    },
   

};
