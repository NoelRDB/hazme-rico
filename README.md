# Hazme Rico (a céntimos)

¡Bienvenido a tu propio experimento de crowdfunding! Este proyecto crea una
aplicación web donde cualquiera puede enviar una pequeña contribución mediante
Bizum y ver cómo el precio mínimo sube céntimo a céntimo. El objetivo es
demostrar que, si mucha gente aporta un poquito, pasan cosas divertidas.

La solución está dividida en dos partes:

* **Frontend** – una aplicación React con TypeScript basada en Vite. Utiliza
  Tailwind CSS para los estilos, Framer Motion para animaciones y muestra
  contadores animados, un botón para declarar pagos, un modal de envío y una
  tabla de contribuyentes. Todo el contenido es en castellano.
* **Backend/API** – un Cloudflare Worker escrito en TypeScript que expone
  varias rutas REST. Persisten los datos en un KV Namespace para evitar
  gestionar bases de datos. La ruta `/api/state` devuelve el estado actual,
  `/api/claim` registra una declaración de pago en cola y las rutas `/api/admin/*`
  permiten a un administrador aprobar o rechazar las declaraciones.

## Requisitos

- Node.js >= 20 – Para el frontend y generación de builds.
- Wrangler >= 3 – Para desarrollar y desplegar el Worker en Cloudflare.
- Una cuenta de Cloudflare con Workers y Pages habilitados para desplegar.
- Un número Bizum P2P (p. ej. tu número de teléfono en España).

## Estructura del proyecto

```text
hazme-rico/
├─ web/                      # Frontend Vite React TS Tailwind
│  ├─ index.html             # Entrada Vite
│  ├─ index.css              # Tailwind base
│  ├─ tailwind.config.cjs    # Configuración de Tailwind
│  ├─ postcss.config.cjs     # Configuración de PostCSS
│  ├─ vite.config.ts         # Configuración de Vite
│  └─ src/
│     ├─ main.tsx
│     ├─ App.tsx
│     ├─ content.ts          # Textos y legales
│     ├─ lib/api.ts          # Cliente HTTP para la API
│     ├─ components/
│     │  ├─ Counter.tsx
│     │  ├─ PayButton.tsx
│     │  ├─ PayModal.tsx
│     │  ├─ ContributorsTable.tsx
│     │  └─ AdminPage.tsx
│     └─ public/qr-bizum.png # Imagen de QR (placeholder)
├─ worker/                   # Backend Cloudflare Worker
│  ├─ src/index.ts           # Lógica del Worker
│  └─ wrangler.toml          # Configuración para Wrangler
├─ .github/workflows/deploy.yml # Ejemplo de CI/CD
├─ .env.example              # Plantilla para variables de entorno
└─ README.md                 # Este documento
```

## Configuración

1. **Clona este repositorio** y entra en la carpeta `hazme-rico`.
2. Copia el archivo `.env.example` a `.env` y rellena las variables:

   - `VITE_API_BASE` – URL base de tu API (ej. `http://127.0.0.1:8787` durante desarrollo o la URL del Worker en producción).
   - `VITE_BIZUM_NUMBER` – El número Bizum (con prefijo internacional) al que deben enviar las aportaciones.
   - `ADMIN_PASS` – Contraseña para el panel de administración.
   - `CORS_ORIGIN` – Dominio de tu frontend en producción (puedes dejarlo vacío durante desarrollo).

3. **Instala las dependencias** para el frontend:

   ```bash
   cd web
   npm install
   ```

   La carpeta `worker` no requiere dependencias externas más allá de Wrangler.

4. **Crea el namespace de KV** en tu cuenta de Cloudflare y asócialo a tu Worker.

5. **Desarrollo local**

   - Para el frontend, ejecuta:

     ```bash
     cd web
     npm run dev
     ```

     Esto abre un servidor Vite en `http://localhost:5173`.

   - Para la API, ejecuta en otro terminal:

     ```bash
     cd worker
     wrangler dev
     ```

     Esto arrancará un Worker local accesible normalmente en `http://127.0.0.1:8787`.

6. **Despliegue**

   - **Frontend (Pages)**: puedes desplegar la carpeta `web` como un proyecto de Cloudflare Pages. La configuración por defecto de Vite compilará a la carpeta `dist`. Asegúrete de exponer las variables `VITE_API_BASE` y `VITE_BIZUM_NUMBER` en la configuración de Pages.

   - **Backend (Worker)**: despliega el Worker mediante `wrangler deploy` desde la carpeta `worker`. Añade el binding de KV en tu `wrangler.toml` y define la variable de entorno `ADMIN_PASS`.

7. **Panel de administración**

   Visita `/admin` en tu frontend. Se te pedirá la contraseña (enviada vía `x-admin-pass` al Worker). Podrás ver y aprobar/rechazar los pagos pendientes. Cada aprobación sumará el importe al total, incrementará el precio en 0,01 € y mostrará al contribuyente (si consiente). Los datos persistirán en KV.

## Notas sobre RGPD

La aplicación permite que las personas incluyan su nombre opcionalmente. Solo se mostrará si marcan la casilla de consentimiento. Los administradores deben atender cualquier petición de eliminación de datos (ej. mediante correo electrónico), como indica el texto legal.

## CI/CD

El archivo `.github/workflows/deploy.yml` contiene un ejemplo básico de cómo construir y desplegar el frontend y el Worker usando GitHub Actions. Necesitarás configurar los secretos de Cloudflare (API tokens, IDs) para automatizar el despliegue.

## Contribuir

Este proyecto está pensado como un experimento personal. Si detectas errores o quieres mejorarlo, siéntete libre de crear un PR. Recuerda no exponer datos sensibles en el repositorio ni subir contraseñas reales.
