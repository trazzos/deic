import http from "@/src/lib/axios";

export const DepartamentoService = {

    getListDepartamento() {
        return http.get(`/api/departamentos`);
    },
    
    createDepartamento(data: any): Promise<any> {
        return http.post(`/api/departamentos`, data);
    },

    updateDepartamento(id: number, data: any): Promise<any> {
        return http.put(`/api/departamentos/${id}`, data);
    },

    deleteDepartamento(id: number): Promise<any> {
        return http.delete(`/api/departamentos/${id}`);
    },
   

};
