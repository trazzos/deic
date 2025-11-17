import http from "@/src/lib/axios";

export const PersonaService = {

    getListPersona() {
        return http.get(`/api/personas`);
    },

    createPersona(data: any): Promise<any> {
        return http.post(`/api/personas`, data);
    },

    updatePersona(id: number, data: any): Promise<any> {
        // comprobar si es un formData y si tiene _method=PATCH
        if(data instanceof FormData && data.get('_method') === 'PATCH')
            return http.post(`/api/personas/${id}`, data);
        else return http.patch(`/api/personas/${id}`, data);
    },

    deletePersona(id: number): Promise<any> {
        return http.delete(`/api/personas/${id}`);
    },

    infoCuentaPersona(id: number): Promise<any> {
        return http.get(`/api/personas/${id}/cuenta`);
    },

    actualizarCuenta(id: number, data: any): Promise<any> {
        return http.post(`/api/personas/${id}/cuenta`, data);
    },

    disableCuenta(id: number): Promise<any> {
        return http.delete(`/api/personas/${id}/desactivar-cuenta`);
    },
};
 