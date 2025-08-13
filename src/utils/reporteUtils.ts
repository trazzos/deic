import * as XLSX from 'xlsx';

/**
 * Utilidades para manejo de reportes
 */

export const ReporteUtils = {
    /**
     * Exporta datos a Excel
     */
    exportarExcel: (
        datos: any[], 
        nombreArchivo: string, 
        nombreHoja: string = 'Datos',
        hojas?: { nombre: string; datos: any[] }[]
    ) => {
        try {
            const workbook = XLSX.utils.book_new();
            
            if (hojas && hojas.length > 0) {
                // Múltiples hojas
                hojas.forEach(hoja => {
                    const ws = XLSX.utils.json_to_sheet(hoja.datos);
                    XLSX.utils.book_append_sheet(workbook, ws, hoja.nombre);
                });
            } else {
                // Una sola hoja
                const ws = XLSX.utils.json_to_sheet(datos);
                XLSX.utils.book_append_sheet(workbook, ws, nombreHoja);
            }

            const fileName = `${nombreArchivo}-${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            return { success: true, fileName };
        } catch (error) {
            console.error('Error exportando Excel:', error);
            return { success: false, error };
        }
    },

    /**
     * Calcula eficiencia (alcanzado vs proyectado)
     */
    calcularEficiencia: (alcanzado: number, proyectado: number): number => {
        return proyectado > 0 ? Math.round((alcanzado / proyectado) * 100) : 0;
    },

    /**
     * Obtiene el color de severidad basado en el porcentaje
     */
    getSeveridadPorcentaje: (porcentaje: number): string => {
        if (porcentaje >= 80) return 'success';
        if (porcentaje >= 60) return 'warning';
        return 'danger';
    },

    /**
     * Obtiene el color para eficiencia
     */
    getColorEficiencia: (eficiencia: number): string => {
        if (eficiencia >= 80) return 'text-green-500';
        if (eficiencia >= 60) return 'text-yellow-500';
        return 'text-red-500';
    },

    /**
     * Formatea número con separadores de miles
     */
    formatearNumero: (numero: number): string => {
        return numero.toLocaleString('es-ES');
    },

    /**
     * Formatea fecha para mostrar
     */
    formatearFecha: (fecha: Date): string => {
        return fecha.toLocaleDateString('es-ES');
    },

    /**
     * Calcula días entre fechas
     */
    calcularDiasEntreFechas: (fechaInicio: Date, fechaFin: Date): number => {
        const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Obtiene el estatus de progreso basado en fechas y porcentaje
     */
    getEstatusProgreso: (
        fechaInicio: Date, 
        fechaFin: Date, 
        porcentajeAvance: number
    ): { estatus: string; color: string; icon: string } => {
        const hoy = new Date();
        const totalDias = ReporteUtils.calcularDiasEntreFechas(fechaInicio, fechaFin);
        const diasTranscurridos = ReporteUtils.calcularDiasEntreFechas(fechaInicio, hoy);
        const porcentajeEsperado = Math.min((diasTranscurridos / totalDias) * 100, 100);

        if (porcentajeAvance >= 100) {
            return { estatus: 'Completado', color: 'text-green-500', icon: 'pi-check-circle' };
        }

        if (hoy > fechaFin && porcentajeAvance < 100) {
            return { estatus: 'Atrasado', color: 'text-red-500', icon: 'pi-exclamation-triangle' };
        }

        if (porcentajeAvance < porcentajeEsperado - 10) {
            return { estatus: 'En Riesgo', color: 'text-orange-500', icon: 'pi-clock' };
        }

        return { estatus: 'En Tiempo', color: 'text-blue-500', icon: 'pi-info-circle' };
    },

    /**
     * Agrupa datos por una propiedad específica
     */
    agruparPor: <T>(datos: T[], propiedad: keyof T): Record<string, T[]> => {
        return datos.reduce((grupos: Record<string, T[]>, item: T) => {
            const clave = String(item[propiedad]);
            if (!grupos[clave]) {
                grupos[clave] = [];
            }
            grupos[clave].push(item);
            return grupos;
        }, {});
    },

    /**
     * Calcula estadísticas básicas de un array de números
     */
    calcularEstadisticas: (numeros: number[]) => {
        if (numeros.length === 0) return { min: 0, max: 0, promedio: 0, suma: 0 };
        
        const suma = numeros.reduce((acc, num) => acc + num, 0);
        const promedio = suma / numeros.length;
        const min = Math.min(...numeros);
        const max = Math.max(...numeros);

        return { min, max, promedio: Math.round(promedio), suma };
    },

    /**
     * Genera datos para gráficos de Chart.js
     */
    generarDatosGrafico: (
        etiquetas: string[], 
        datasets: { label: string; data: number[]; backgroundColor?: string; borderColor?: string }[]
    ) => {
        const documentStyle = getComputedStyle(document.documentElement);
        
        return {
            labels: etiquetas,
            datasets: datasets.map((dataset, index) => ({
                ...dataset,
                backgroundColor: dataset.backgroundColor || documentStyle.getPropertyValue(`--blue-${500 + index * 100}`),
                borderColor: dataset.borderColor || documentStyle.getPropertyValue(`--blue-${500 + index * 100}`),
            }))
        };
    },

    /**
     * Obtiene opciones por defecto para gráficos
     */
    getOpcionesGrafico: () => {
        const documentStyle = getComputedStyle(document.documentElement);
        
        return {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {
                    labels: {
                        fontColor: documentStyle.getPropertyValue('--text-color')
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: documentStyle.getPropertyValue('--text-color-secondary'),
                        font: {
                            weight: 500
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: documentStyle.getPropertyValue('--text-color-secondary')
                    },
                    grid: {
                        color: documentStyle.getPropertyValue('--surface-border'),
                        drawBorder: false
                    }
                }
            }
        };
    }
};
