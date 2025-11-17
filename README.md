## Introducción

Este proyecto está construido con Next.js (App Router) + React.js. El enrutamiento moderno del proyecto aprovecha la carpeta `app/` de Next.js (App Router) junto con componentes React para renderizado del lado del cliente y del servidor. Para aprovechar el enrutamiento de Next.js es necesario contar con ambas tecnologías (Next.js y React), ya que App Router usa convenciones y APIs propias sobre React.

## Iniciar entorno local (Getting Started)

1. Requisitos previos

- Node.js 18+ y npm (para Next.js y ReactJS)
- Git (para clonar y gestionar versiones del código)

Sigue estos pasos para levantar el entorno local de desarrollo.

2. Clonar el repositorio:

```bash
git clone https://github.com/trazzos/deic.git
cd deic
```

3. Copiar variables de entorno y actualizarlas (desde la raíz del proyecto):

```bash
# Asegúrate de estar en la carpeta donde clonaste el proyecto (ej: /home/proyectos/deic)
cp .env.example .env.local
# Edita .env.local con tu editor y actualiza el valor de las variables
```
4. Instalar dependencias y levantar el frontend (desde la carpeta del proyecto clonado):

```bash
# Asegúrate de estar en la carpeta donde clonaste el proyecto (ej: /home/proyectos/deic)
# Instalar dependencias
npm install

# Asegúrate de estar en la carpeta donde clonaste el proyecto (ej: /home/proyectos/deic)
# Iniciar servidor de desarrollo (Next.js + React)
npm run dev
# o
yarn dev
# o
pnpm dev
# o
bun dev
```

5. Si tu despliegue usa un backend Laravel en otro repositorio o carpeta, levanta la API según su README y asegúrate que `NEXT_PUBLIC_API_URL` apunte al endpoint correcto (ej: `http://localhost:8000` o `http://localhost:8080/api`).

6. Abrir en el navegador:

```
http://localhost:3000
```

## Despliegue en producción (Servidor dedicado o compartido) 🚀

- Servidor dedicado: Garantiza acceso total a linea de comandos.
- Compartido: Comprueba con tu proveedor si tienes acceso a linea de comando, permitido ejecutar 
comandos sudos y editar archivos de virtualhost, de lo contrario no podras continuar.

Esta aplicación usa Next.js (Frontend) y una API separada. En esta sección nos enfocamos en el despliegue del Frontend (Next.js + React). Para el Backend (API) consulta su README.

### 1) Requisitos previos

- Node.js 18+ y npm (para Next.js)
- Git (para clonar y gestionar versiones del código)
- Servidor HTTP: Nginx o Apache (Nginx recomendado para proxy reverso)
- Certificados SSL (Let’s Encrypt u otro proveedor)  
- Acceso a la terminal y permisos para instalar dependencias y servicios
- pm2 o systemd para mantener el proceso node en ejecución

Nota: Las instrucciones son para colocar el proyecto en un sistema Linux

Se recomienda colocar el proyecto en directorios estándar como `/var/www/` o `/srv/`.
Ejemplo de estructura:

```bash
sudo mkdir -p /var/www/deic
sudo chown -R $USER:www-data /var/www/deic
cd /var/www/deic
git clone https://github.com/trazzos/deic.git .
```

Si prefieres desplegar en otra carpeta (ej. `/home/deploy/` o `/opt/`), asegúrate de usar permisos apropiados para que `www-data` o el usuario del servidor web pueda servir los archivos.

### 2) Arquitectura

- Frontend: Next.js + React — sirve la interfaz y usa App Router (`app/`)
- Backend/API: Implementación separada; para despliegue y detalles consulta su README

Si usas dominios distintos para frontend y API, ajusta CORS y cookies en la API.

### 3) Variables de entorno

En la carpeta raíz del proyecto Frontend (Next.js):

1. Copia el archivo `.env.example` a `env.production`

```bash
cp .env.example env.production
```

2. Abre `env.production` y actualiza las variables necesarias, por ejemplo:

- NEXT_PUBLIC_API_URL='URL base de la API (ej. https://api.example.com)'
- NEXT_PUBLIC_COOKIE_NAME='Nombre de la cookie que debe coincidir con el de la API'
- NEXT_PUBLIC_TITLE_PAGE='Nombre de la plataforma'
- NEXT_PUBLIC_STORAGE_KEY='llave-poderosa-local'

Para el Backend (API): consultar su README para la configuración del servidor y de la base de datos.

### 4) Build y despliegue del Frontend (Next.js)

1. Instalar dependencias (desde el directorio del proyecto clonado):

```bash
# Asegúrate de estar en la carpeta donde clonaste el proyecto (ej: /var/www/deic)
cd /var/www/deic
npm install
```

2. Construir la aplicación para producción (ejecutar dentro del directorio del proyecto clonado):

```bash
# Desde el directorio del proyecto clonado (ej: /var/www/deic)
cd /var/www/deic
npm run build
```

3. Ejecutar en modo producción (opciones):

```bash
# Desde el directorio del proyecto clonado (ej: /var/www/deic)
npm run start
# o
next start -p 3000
```

- Usar `pm2` para mantener el proceso en ejecución:

```bash
npm install -g pm2
# Ejecuta pm2 desde dentro del directorio del proyecto (donde está el package.json)
cd /var/www/deic
pm2 start npm --name "deic-frontend" -- start
pm2 save

# Alternativa: si prefieres ejecutar pm2 desde cualquier carpeta, puedes usar --cwd
# (cambia la ruta por la ubicación real del proyecto en tu servidor):
```bash
pm2 start npm --name "deic-frontend" --cwd /var/www/deic -- start
pm2 save
```

4. Configurar proxy reverso (Nginx / Apache)

4.1 Nginx (Proxy reverso) — HTTP

Ejemplo de `server` para Nginx que proxee a Next.js (HTTP):

```
server {
	listen 80;
	server_name app.example.com;

	location / {
		proxy_pass http://127.0.0.1:3000;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
	}
}
```

4.2 Apache (Proxy reverso) — HTTP

Ejemplo de `VirtualHost` para Apache que proxee a Next.js (HTTP):

```apache
<VirtualHost *:80>
	ServerName app.example.com

	# Habilitar módulos si no están habilitados
	# sudo a2enmod proxy
	# sudo a2enmod proxy_http
	# sudo a2enmod proxy_wstunnel
	# sudo systemctl restart apache2

	ProxyPreserveHost On
	ProxyRequests Off

	ProxyPass / http://127.0.0.1:3000/
	ProxyPassReverse / http://127.0.0.1:3000/

	ErrorLog ${APACHE_LOG_DIR}/app-error.log
	CustomLog ${APACHE_LOG_DIR}/app-access.log combined
</VirtualHost>
```

5. Habilitar HTTPS (certificados) y ajustar cabeceras de seguridad

5.1 Nginx (HTTPS)
Let's Encrypt / certbot y cabeceras de seguridad

Para levantar certificados y configurar HTTPS de forma automática en Nginx con certbot (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
# Ejecutar certbot para crear y configurar el certificado
sudo certbot --nginx -d app.example.com
```

Ejemplo de `server` para Nginx con HTTPS y cabeceras de seguridad:

```nginx
server {
	listen 80;
	server_name app.example.com;

	# Redirige todo a HTTPS
	return 301 https://$host$request_uri;
}

server {
	listen 443 ssl http2;
	server_name app.example.com;

	ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
	ssl_protocols TLSv1.2 TLSv1.3;
	ssl_prefer_server_ciphers on;
	ssl_session_cache shared:SSL:10m;
	add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

	# Proxy a Next.js corriendo localmente
	location / {
		proxy_pass http://127.0.0.1:3000;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
	}

	access_log /var/log/nginx/app-access.log;
	error_log /var/log/nginx/app-error.log;
}
```

Notas para Nginx:

- `certbot --nginx` intentará configurar Nginx automáticamente. Si usas una configuración personalizada, puedes usar `certbot certonly --nginx` y luego insertar manualmente los paths.
- Renovación automática: `sudo certbot renew` — certbot crea tareas programadas al instalar.

5.2 Apache (HTTPS)

Ejemplo de configuración de `VirtualHost` para Apache con SSL y proxy reverso hacia Next.js:

```apache
<VirtualHost *:443>
	ServerName app.example.com

	SSLEngine on
	SSLCertificateFile /etc/letsencrypt/live/app.example.com/fullchain.pem
	SSLCertificateKeyFile /etc/letsencrypt/live/app.example.com/privkey.pem

	ProxyPreserveHost On
	ProxyRequests Off

	ProxyPass / http://127.0.0.1:3000/
	ProxyPassReverse / http://127.0.0.1:3000/

	ErrorLog ${APACHE_LOG_DIR}/app-error.log
	CustomLog ${APACHE_LOG_DIR}/app-access.log combined
</VirtualHost>
```

Nota: ajusta `ProxyPass` y `ProxyPassReverse` según el puerto/host donde esté corriendo `next start`.

Apache + SSL (Let's Encrypt / certbot)

Si usas Let's Encrypt, usa `certbot --apache` para configurar SSL automáticamente.

1. Instalar certbot plugin para Apache:

```bash
sudo apt update
sudo apt install certbot python3-certbot-apache
```

2. Solicitar y aplicar certificado con Apache plugin:

```bash
sudo certbot --apache -d app.example.com
```

3. Si no quieres modificar automáticamente la configuración de Apache, usa `certbot certonly --apache` y luego añade los `SSLCertificateFile` y `SSLCertificateKeyFile` en tu VirtualHost.

4. Renovación: `sudo certbot renew --dry-run` para pruebas o `sudo certbot renew` en producción (certbot instala hooks cron/`systemd` timer).

### 5) API / Backend

La API está implementada por separado; para el despliegue, configuración y dependencias del backend,revisa el README del backend.

### 6) Consideraciones de producción

- CORS: si frontend y API están en distinto dominio, configura CORS en la API
- Cookies y seguridad: usa secure cookies y el dominio correcto para producción
