import http from "@/src/lib/axios";

export const BeneficiarioService = {

    getListBeneficiario() {
        return http.get(`/api/beneficiarios`);
    },
    
    createBeneficiario(data: any): Promise<any> {
        return http.post(`/api/beneficiarios`, data);
    },

    updateBeneficiario(id: number, data: any): Promise<any> {
        return http.put(`/api/beneficiarios/${id}`, data);
    },

    deleteBeneficiario(id: number): Promise<any> {
        return http.delete(`/api/beneficiarios/${id}`);
    },
   

};
