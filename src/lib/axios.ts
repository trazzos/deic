import axios from 'axios';
import { getCachedToken } from '@/layout/context/authContext';

// Crea una instancia de Axios
const http = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/',
    headers: {
    'X-Requested-With': 'XMLHttpRequest',
   },
});


http.interceptors.request.use(
    (config) => {
        const token = getCachedToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

http.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // Manejo global de errores de autenticación
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            
            if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
                // Guardar la ruta actual para redirección posterior
                const currentPath = window.location.pathname;
                if (currentPath !== '/') {
                    sessionStorage.setItem('redirectAfterLogin', currentPath);
                }
                
                // Redirigir directamente para evitar delays
                window.location.href = '/auth/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default http;