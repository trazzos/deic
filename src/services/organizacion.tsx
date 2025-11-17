import http from '@/src/lib/axios';
import { 
    Secretaria, 
    Subsecretaria, 
    Direccion,
} from '@/types/organizacion';

export const OrganizacionService = {

    async getSecretarias(): Promise<any> {
        return await http.get(`/api/secretarias`);
    },


    async createSecretaria(data:Omit<Secretaria, 'id'>): Promise<any> {
        return await http.post('/api/secretarias', data);
     
    },

    async updateSecretaria(id: number, data: Partial<Secretaria>): Promise<any> {
        return await http.patch(`/api/secretarias/${id}`, data);
        
    },

    async deleteSecretaria(id: number): Promise<any> {
        return await http.delete(`/api/secretarias/${id}`);
   
    },

    // SUBSECRETARÍAS
    async getSubsecretarias(): Promise<any> {
        return await http.get('/api/subsecretarias');
    },

    async createSubsecretaria(data: Omit<Subsecretaria, 'id' | 'secretaria'>): Promise<any> {
        return await http.post(`api/subsecretarias`, data);
    },

    async updateSubsecretaria(id: number, data: Partial<Omit<Subsecretaria, 'secretaria'>>): Promise<any> {
        return await http.patch(`/api/subsecretarias/${id}`, data);
    },

    async deleteSubsecretaria(id: number): Promise<any> {
        return await http.delete(`/api/subsecretarias/${id}`);
    },

    // DIRECCIONES
    async getDirecciones(): Promise<any> {
        return await http.get('/api/direcciones');
    },

    async createDireccion(data: Omit<Direccion, 'id' | 'subsecretaria'>): Promise<any> {
        return await http.post(`api/direcciones`, data);
    },

    async updateDireccion(id: number, data: Partial<Omit<Direccion, 'id' | 'subsecretaria'>>): Promise<any> {
        return await http.patch(`/api/direcciones/${id}`, data);
    },

    async deleteDireccion(id: number): Promise<any> {
        return await http.delete(`/api/direcciones/${id}`);
    }
}