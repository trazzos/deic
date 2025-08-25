import api from '@/src/lib/axios';

export interface Secretaria {
    id?: number;
    nombre: string;
    descripcion: string;
    created_at?: string;
    updated_at?: string;
}

export interface Subsecretaria {
    id?: number;
    nombre: string;
    descripcion: string;
    secretaria_id: number;
    secretaria?: {
        id: number;
        nombre: string;
    };
    created_at?: string;
    updated_at?: string;
}

export interface Direccion {
    id?: number;
    nombre: string;
    descripcion: string;
    subsecretaria_id: number;
    subsecretaria?: {
        id: number;
        nombre: string;
        secretaria?: {
            id: number;
            nombre: string;
        };
    };
    created_at?: string;
    updated_at?: string;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    status?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

class OrganizacionService {
    // SECRETARÍAS
    async getSecretarias(params?: {
        page?: number;
        per_page?: number;
        search?: string;
    }): Promise<ApiResponse<Secretaria[]>> {
        const response = await api.get('/secretarias', { params });
        return response.data;
    }

    async getSecretaria(id: number): Promise<ApiResponse<Secretaria>> {
        const response = await api.get(`/secretarias/${id}`);
        return response.data;
    }

    async createSecretaria(data: Omit<Secretaria, 'id'>): Promise<ApiResponse<Secretaria>> {
        const response = await api.post('/secretarias', data);
        return response.data;
    }

    async updateSecretaria(id: number, data: Partial<Secretaria>): Promise<ApiResponse<Secretaria>> {
        const response = await api.put(`/secretarias/${id}`, data);
        return response.data;
    }

    async deleteSecretaria(id: number): Promise<ApiResponse<{ success: boolean }>> {
        const response = await api.delete(`/secretarias/${id}`);
        return response.data;
    }

    // SUBSECRETARÍAS
    async getSubsecretarias(params?: {
        page?: number;
        per_page?: number;
        search?: string;
        secretaria_id?: number;
    }): Promise<ApiResponse<Subsecretaria[]>> {
        const response = await api.get('/subsecretarias', { params });
        return response.data;
    }

    async getSubsecretaria(id: number): Promise<ApiResponse<Subsecretaria>> {
        const response = await api.get(`/subsecretarias/${id}`);
        return response.data;
    }

    async createSubsecretaria(data: Omit<Subsecretaria, 'id' | 'secretaria'>): Promise<ApiResponse<Subsecretaria>> {
        const response = await api.post('/subsecretarias', data);
        return response.data;
    }

    async updateSubsecretaria(id: number, data: Partial<Omit<Subsecretaria, 'secretaria'>>): Promise<ApiResponse<Subsecretaria>> {
        const response = await api.put(`/subsecretarias/${id}`, data);
        return response.data;
    }

    async deleteSubsecretaria(id: number): Promise<ApiResponse<{ success: boolean }>> {
        const response = await api.delete(`/subsecretarias/${id}`);
        return response.data;
    }

    // DIRECCIONES
    async getDirecciones(params?: {
        page?: number;
        per_page?: number;
        search?: string;
        subsecretaria_id?: number;
        secretaria_id?: number;
    }): Promise<ApiResponse<Direccion[]>> {
        const response = await api.get('/direcciones', { params });
        return response.data;
    }

    async getDireccion(id: number): Promise<ApiResponse<Direccion>> {
        const response = await api.get(`/direcciones/${id}`);
        return response.data;
    }

    async createDireccion(data: Omit<Direccion, 'id' | 'subsecretaria'>): Promise<ApiResponse<Direccion>> {
        const response = await api.post('/direcciones', data);
        return response.data;
    }

    async updateDireccion(id: number, data: Partial<Omit<Direccion, 'subsecretaria'>>): Promise<ApiResponse<Direccion>> {
        const response = await api.put(`/direcciones/${id}`, data);
        return response.data;
    }

    async deleteDireccion(id: number): Promise<ApiResponse<{ success: boolean }>> {
        const response = await api.delete(`/direcciones/${id}`);
        return response.data;
    }

    // UTILITY METHODS
    async getSecretariasForSelect(): Promise<ApiResponse<Array<{ id: number; nombre: string }>>> {
        const response = await api.get('/secretarias/select');
        return response.data;
    }

    async getSubsecretariasForSelect(secretaria_id?: number): Promise<ApiResponse<Array<{ id: number; nombre: string }>>> {
        const params = secretaria_id ? { secretaria_id } : undefined;
        const response = await api.get('/subsecretarias/select', { params });
        return response.data;
    }

    async getDireccionesForSelect(subsecretaria_id?: number): Promise<ApiResponse<Array<{ id: number; nombre: string }>>> {
        const params = subsecretaria_id ? { subsecretaria_id } : undefined;
        const response = await api.get('/direcciones/select', { params });
        return response.data;
    }

    // HIERARCHY METHODS
    async getOrganizationHierarchy(): Promise<ApiResponse<{
        secretarias: (Secretaria & {
            subsecretarias: (Subsecretaria & {
                direcciones: Direccion[];
            })[];
        })[];
    }>> {
        const response = await api.get('/organizacion/jerarquia');
        return response.data;
    }

    async validateHierarchy(type: 'subsecretaria' | 'direccion', parent_id: number): Promise<ApiResponse<{ valid: boolean; message?: string }>> {
        const response = await api.get(`/organizacion/validar-jerarquia`, {
            params: { type, parent_id }
        });
        return response.data;
    }
}

// Mock data for development/testing
export const mockOrganizacionService = {
    // SECRETARÍAS MOCK DATA
    secretariasMock: [
        { 
            id: 1, 
            nombre: 'Secretaría de Desarrollo Económico', 
            descripcion: 'Encargada del desarrollo económico del estado',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        },
        { 
            id: 2, 
            nombre: 'Secretaría de Educación', 
            descripcion: 'Responsable del sistema educativo estatal',
            created_at: '2024-01-02T00:00:00.000Z',
            updated_at: '2024-01-02T00:00:00.000Z'
        },
        { 
            id: 3, 
            nombre: 'Secretaría de Salud', 
            descripcion: 'Administra los servicios de salud pública',
            created_at: '2024-01-03T00:00:00.000Z',
            updated_at: '2024-01-03T00:00:00.000Z'
        }
    ],

    // SUBSECRETARÍAS MOCK DATA
    subsecretariasMock: [
        { 
            id: 1, 
            nombre: 'Subsecretaría de Industria', 
            descripcion: 'Desarrollo industrial', 
            secretaria_id: 1,
            secretaria: { id: 1, nombre: 'Secretaría de Desarrollo Económico' },
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        },
        { 
            id: 2, 
            nombre: 'Subsecretaría de Comercio', 
            descripcion: 'Fomento comercial', 
            secretaria_id: 1,
            secretaria: { id: 1, nombre: 'Secretaría de Desarrollo Económico' },
            created_at: '2024-01-02T00:00:00.000Z',
            updated_at: '2024-01-02T00:00:00.000Z'
        },
        { 
            id: 3, 
            nombre: 'Subsecretaría de Educación Básica', 
            descripcion: 'Educación primaria y secundaria', 
            secretaria_id: 2,
            secretaria: { id: 2, nombre: 'Secretaría de Educación' },
            created_at: '2024-01-03T00:00:00.000Z',
            updated_at: '2024-01-03T00:00:00.000Z'
        }
    ],

    // DIRECCIONES MOCK DATA
    direccionesMock: [
        { 
            id: 1, 
            nombre: 'Dirección de Promoción Industrial', 
            descripcion: 'Promoción de la industria', 
            subsecretaria_id: 1,
            subsecretaria: { 
                id: 1, 
                nombre: 'Subsecretaría de Industria',
                secretaria: { id: 1, nombre: 'Secretaría de Desarrollo Económico' }
            },
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
        },
        { 
            id: 2, 
            nombre: 'Dirección de Exportaciones', 
            descripcion: 'Fomento a las exportaciones', 
            subsecretaria_id: 2,
            subsecretaria: { 
                id: 2, 
                nombre: 'Subsecretaría de Comercio',
                secretaria: { id: 1, nombre: 'Secretaría de Desarrollo Económico' }
            },
            created_at: '2024-01-02T00:00:00.000Z',
            updated_at: '2024-01-02T00:00:00.000Z'
        },
        { 
            id: 3, 
            nombre: 'Dirección de Primarias', 
            descripcion: 'Administración de escuelas primarias', 
            subsecretaria_id: 3,
            subsecretaria: { 
                id: 3, 
                nombre: 'Subsecretaría de Educación Básica',
                secretaria: { id: 2, nombre: 'Secretaría de Educación' }
            },
            created_at: '2024-01-03T00:00:00.000Z',
            updated_at: '2024-01-03T00:00:00.000Z'
        }
    ],

    // Mock methods
    delay: (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms)),

    async getSecretarias() {
        await this.delay();
        return { data: [...this.secretariasMock] };
    },

    async createSecretaria(data: Omit<Secretaria, 'id'>) {
        await this.delay();
        const newSecretaria = { 
            ...data, 
            id: Math.max(...this.secretariasMock.map(s => s.id || 0)) + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        this.secretariasMock.push(newSecretaria);
        return { data: newSecretaria };
    },

    async updateSecretaria(id: number, data: Partial<Secretaria>) {
        await this.delay();
        const index = this.secretariasMock.findIndex(s => s.id === id);
        if (index !== -1) {
            this.secretariasMock[index] = { 
                ...this.secretariasMock[index], 
                ...data, 
                updated_at: new Date().toISOString() 
            };
            return { data: this.secretariasMock[index] };
        }
        throw new Error('Secretaría no encontrada');
    },

    async deleteSecretaria(id: number) {
        await this.delay();
        const index = this.secretariasMock.findIndex(s => s.id === id);
        if (index !== -1) {
            this.secretariasMock.splice(index, 1);
            return { data: { success: true } };
        }
        throw new Error('Secretaría no encontrada');
    },

    // Similar methods for subsecretarias and direcciones...
    async getSubsecretarias() {
        await this.delay();
        return { data: [...this.subsecretariasMock] };
    },

    async createSubsecretaria(data: Omit<Subsecretaria, 'id' | 'secretaria'>) {
        await this.delay();
        const secretaria = this.secretariasMock.find(s => s.id === data.secretaria_id);
        if (!secretaria) {
            throw new Error('Secretaría no encontrada');
        }
        const newSubsecretaria = { 
            ...data, 
            id: Math.max(...this.subsecretariasMock.map(s => s.id || 0)) + 1,
            secretaria: { id: secretaria.id!, nombre: secretaria.nombre },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        this.subsecretariasMock.push(newSubsecretaria);
        return { data: newSubsecretaria };
    },

    async updateSubsecretaria(id: number, data: Partial<Omit<Subsecretaria, 'secretaria'>>) {
        await this.delay();
        const index = this.subsecretariasMock.findIndex(s => s.id === id);
        if (index !== -1) {
            const secretaria = data.secretaria_id ? 
                this.secretariasMock.find(s => s.id === data.secretaria_id) : 
                undefined;
            
            this.subsecretariasMock[index] = { 
                ...this.subsecretariasMock[index], 
                ...data, 
                secretaria: secretaria ? { id: secretaria.id!, nombre: secretaria.nombre } : this.subsecretariasMock[index].secretaria,
                updated_at: new Date().toISOString() 
            };
            return { data: this.subsecretariasMock[index] };
        }
        throw new Error('Subsecretaría no encontrada');
    },

    async deleteSubsecretaria(id: number) {
        await this.delay();
        const index = this.subsecretariasMock.findIndex(s => s.id === id);
        if (index !== -1) {
            this.subsecretariasMock.splice(index, 1);
            return { data: { success: true } };
        }
        throw new Error('Subsecretaría no encontrada');
    },

    async getDirecciones() {
        await this.delay();
        return { data: [...this.direccionesMock] };
    },

    async createDireccion(data: Omit<Direccion, 'id' | 'subsecretaria'>) {
        await this.delay();
        const subsecretaria = this.subsecretariasMock.find(s => s.id === data.subsecretaria_id);
        if (!subsecretaria) {
            throw new Error('Subsecretaría no encontrada');
        }
        const newDireccion = { 
            ...data, 
            id: Math.max(...this.direccionesMock.map(d => d.id || 0)) + 1,
            subsecretaria: { 
                id: subsecretaria.id!, 
                nombre: subsecretaria.nombre,
                secretaria: subsecretaria.secretaria
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        this.direccionesMock.push(newDireccion);
        return { data: newDireccion };
    },

    async updateDireccion(id: number, data: Partial<Omit<Direccion, 'subsecretaria'>>) {
        await this.delay();
        const index = this.direccionesMock.findIndex(d => d.id === id);
        if (index !== -1) {
            const subsecretaria = data.subsecretaria_id ? 
                this.subsecretariasMock.find(s => s.id === data.subsecretaria_id) : 
                undefined;
            
            this.direccionesMock[index] = { 
                ...this.direccionesMock[index], 
                ...data, 
                subsecretaria: subsecretaria ? { 
                    id: subsecretaria.id!, 
                    nombre: subsecretaria.nombre,
                    secretaria: subsecretaria.secretaria
                } : this.direccionesMock[index].subsecretaria,
                updated_at: new Date().toISOString() 
            };
            return { data: this.direccionesMock[index] };
        }
        throw new Error('Dirección no encontrada');
    },

    async deleteDireccion(id: number) {
        await this.delay();
        const index = this.direccionesMock.findIndex(d => d.id === id);
        if (index !== -1) {
            this.direccionesMock.splice(index, 1);
            return { data: { success: true } };
        }
        throw new Error('Dirección no encontrada');
    }
};

export default new OrganizacionService();
