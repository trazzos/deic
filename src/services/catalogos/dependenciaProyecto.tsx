import http from "@/src/lib/axios";

export const DependenciaProyectoService = {

    getAll() {
        return http.get(`/api/catalogos/all`);
    },   
};