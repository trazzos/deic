import http from "@/src/lib/axios";

export const RoleService = {

    getListRoles() {
        return http.get(`/api/roles`);
    },

    getListPermisos() {
        return http.get(`/api/permisos`);
    },

    createRole(data: any): Promise<any> {
        return http.post(`/api/roles`, data);
    },

    updateRole(id: number, data: any): Promise<any> {
        return http.put(`/api/roles/${id}`, data);
    },

    deleteRole(id: number): Promise<any> {
        return http.delete(`/api/roles/${id}`);
    },
};
