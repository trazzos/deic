import http from "@/src/lib/axios";

export const ReporteService = {

    // Obtener reporte general de proyectos
    getReporteActividadesAgrupadoPorTipoProyecto(filtros?: any) {
        return http.post('/api/reportes/actividades-gb-tipo-proyecto', filtros);
    },

    // Obtener reporte de actividades
    getReporteActividades(filtros?: any) {
        return http.post('/api/reportes/actividades', filtros);
    }

};
