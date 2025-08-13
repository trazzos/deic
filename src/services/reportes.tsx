import http from "@/src/lib/axios";

export const ReporteService = {

    // Obtener reporte general de proyectos
    getReporteActividadesAgrupadoPorTipoProyecto(filtros?: any) {
        return http.post('/api/reportes/actividades-gb-tipo-proyecto', filtros);
    },

    // Obtener reporte general de proyectos
    getReporteProyectos(filtros?: any) {
        return http.get('/api/reportes/proyectos', {
            params: filtros
        });
    },

    // Obtener detalle de un proyecto específico
    getDetalleProyecto(uuid: string) {
        return http.get(`/api/reportes/proyectos/${uuid}`);
    },

    // Obtener reporte de actividades
    getReporteActividades(filtros?: any) {
        return http.get('/api/reportes/actividades', {
            params: filtros
        });
    },

    // Obtener reporte de capacitadores
    getReporteCapacitadores(filtros?: any) {
        return http.get('/api/reportes/capacitadores', {
            params: filtros
        });
    },

    // Obtener reporte de beneficiarios
    getReporteBeneficiarios(filtros?: any) {
        return http.get('/api/reportes/beneficiarios', {
            params: filtros
        });
    },

    // Obtener reporte financiero
    getReporteFinanciero(filtros?: any) {
        return http.get('/api/reportes/financiero', {
            params: filtros
        });
    },

    // Obtener datos para dashboard ejecutivo
    getDashboardEjecutivo(filtros?: any) {
        return http.get('/api/reportes/dashboard', {
            params: filtros
        });
    },

    // Exportar reporte a Excel
    exportarReporte(tipo: string, filtros?: any) {
        return http.get(`/api/reportes/${tipo}/export`, {
            params: filtros,
            responseType: 'blob'
        });
    },

    // Obtener estadísticas generales
    getEstadisticasGenerales() {
        return http.get('/api/reportes/estadisticas');
    }
};
