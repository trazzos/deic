/**
 * Utilidad para formatear errores de validación del servidor (422)
 */

export interface ValidationError {
    [field: string]: string;
}

export interface ServerErrorResponse {
    message?: string;
    errors?: { [field: string]: string[] };
    code?: number;
    response?: {
        data?: {
            message?: string;
            errors?: { [field: string]: string[] };
            code?: number;
        };
        status?: number;
    };
}

/**
 * Formatea errores de validación 422 del servidor
 * @param error - Error capturado en el catch
 * @returns { isValidationError: boolean, formattedErrors: ValidationError, message: string }
 */
export const formatValidationErrors = (error: any): {
    isValidationError: boolean;
    formattedErrors: ValidationError;
    message: string;
} => {
    const result = {
        isValidationError: false,
        formattedErrors: {} as ValidationError,
        message: 'Ha ocurrido un error inesperado'
    };

    try {
        let serverResponse: any = null;

        // Caso 1: Error directo con estructura del servidor
        if (error.errors && typeof error.errors === 'object') {
            serverResponse = error;
        }
        // Caso 2: Error envuelto en response.data (Axios)
        else if (error.response?.data?.errors) {
            serverResponse = error.response.data;
        }
        // Caso 3: Error envuelto en response (fetch)
        else if (error.response?.errors) {
            serverResponse = error.response;
        }
        // Caso 4: Verificar si es error 422
        else if (error.response?.status === 422 || error.code === 422) {
            serverResponse = error.response?.data || error;
        }

        // Si encontramos una respuesta del servidor con errores
        if (serverResponse?.errors) {
            result.isValidationError = true;
            result.message = serverResponse.message || 'Los datos proporcionados no son válidos';

            // Formatear errores: convertir array de strings a string único
            Object.keys(serverResponse.errors).forEach(field => {
                const fieldErrors = serverResponse.errors[field];
                if (Array.isArray(fieldErrors)) {
                    // Tomar el primer error o concatenar todos
                    result.formattedErrors[field] = fieldErrors[0] || 'Error de validación';
                } else if (typeof fieldErrors === 'string') {
                    result.formattedErrors[field] = fieldErrors;
                }
            });
        }
        // Si no hay errores de validación pero hay mensaje
        else if (serverResponse?.message) {
            result.message = serverResponse.message;
        }
        // Si es un error de red u otro tipo
        else if (error.message) {
            result.message = error.message;
        }

    } catch (parseError) {
        console.warn('Error al procesar errores de validación:', parseError);
        result.message = 'Error al procesar la respuesta del servidor';
    }

    return result;
};

/**
 * Hook personalizado para manejar errores de formulario
 * @param setErrors - Función para establecer errores en el estado
 * @param showError - Función para mostrar mensajes de error
 */
export const useFormErrorHandler = (
    setErrors: (errors: ValidationError) => void,
    showError: (message: string) => void
) => {
    return (error: any) => {
        const { isValidationError, formattedErrors, message } = formatValidationErrors(error);
        
        if (isValidationError) {
            setErrors(formattedErrors);
            // Opcional: mostrar también el mensaje general
            if (Object.keys(formattedErrors).length === 0) {
                showError(message);
            }
        } else {
            setErrors({});
            showError(message);
        }
    };
};

/**
 * Versión simplificada para casos donde solo necesitas los errores
 * @param error - Error del servidor
 * @returns ValidationError object
 */
export const extractValidationErrors = (error: any): ValidationError => {
    const { formattedErrors } = formatValidationErrors(error);
    return formattedErrors;
};

/**
 * Verificar si un error es de validación (422)
 * @param error - Error a verificar
 * @returns boolean
 */
export const isValidationError = (error: any): boolean => {
    const { isValidationError } = formatValidationErrors(error);
    return isValidationError;
};

/**
 * Obtener mensaje de error principal
 * @param error - Error del servidor
 * @returns string
 */
export const getErrorMessage = (error: any): string => {
    const { message } = formatValidationErrors(error);
    return message;
};