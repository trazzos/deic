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
        // Ejemplo: manejo global de errores 401
        if (error.response && error.response.status === 401) {
            // Puedes redirigir al login o limpiar sesión aquí
            //limpia sesion aqui usando cookies o destruir la sesión del usuario

            // Por ejemplo, si estás usando cookies:
            // await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {}, { withCredentials: true });

            if (window.location.pathname !== '/auth/login') {
                console.error('Unauthorized access - redirecting to login');
                document.cookie = `${process.env.NEXT_PUBLIC_COOKIE_NAME}_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
                document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
                window.location.href = '/auth/login';
            }
        }
        return Promise.reject(error);
    }
);

export default http;