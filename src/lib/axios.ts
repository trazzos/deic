import axios from 'axios';

// Crea una instancia de Axios
const http = axios.create({
    baseURL:'/',
    headers: {
    'X-Requested-With': 'XMLHttpRequest',
   },
    withCredentials: true,
    withXSRFToken:true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
});


http.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => Promise.reject(error)
);

http.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // Manejo global de errores de autenticación
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn('🔒 Error de autenticación detectado:', error.response.status);
            
            // Guardar la ruta actual para redirección posterior si no estamos ya en login
            if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
                const currentPath = window.location.pathname;
                if (currentPath !== '/') {
                    sessionStorage.setItem('redirectAfterLogin', currentPath);
                }
                
                // Limpiar cookies de sesión
                document.cookie = `${process.env.NEXT_PUBLIC_COOKIE_NAME}_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
                document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
                
                // No redirigir aquí - dejar que SessionGuard maneje la redirección
                // Esto evita conflictos entre el interceptor y el guard
                console.log('🔄 SessionGuard se encargará de la redirección...');
            }
        }
        
        return Promise.reject(error);
    }
);

export default http;