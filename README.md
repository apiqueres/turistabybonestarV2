# TuristaByBonestar — Web

Web de la agencia de viajes a medida TuristaByBonestar (Sueca, Valencia). Estilo editorial premium en tema claro (blanco, negro y cian), con animaciones GSAP + ScrollTrigger. Las fotografías de los destinos son reales (Wikimedia Commons, licencias libres, ver `/creditos`); el vídeo hero, la foto de «Sobre nosotros», la del cierre y los retratos del equipo se generaron con Higgsfield.

El backend vive **dentro del mismo proyecto Next.js** (Route Handlers + componentes de servidor) sobre **PostgreSQL + Prisma**, con el panel `/admin` protegido por **Auth.js** y el correo enviado por **SMTP desde el servidor**. El plan original está en [`docs/PLAN-BACKEND.md`](docs/PLAN-BACKEND.md) y la guía de operación en [`docs/OPERACION.md`](docs/OPERACION.md).

## Rutas

| Ruta | Qué hay |
| --- | --- |
| `/` | Inicio: hero con vídeo, el método en 3 pasos, 6 destinos destacados, sobre nosotros con cifras, las 10 dimensiones que preguntamos, cómo se come + testimonio, equipo con panel lateral y cierre con doble CTA. |
| `/donde-nos-vamos` | Mapa mundial donde **cualquier país es seleccionable** (los 12 recomendados van en cian con marcador), barra "Tu lista" con chips y las 12 fichas de destino en pestañas. Al menos un país es obligatorio para continuar. Acepta `?pais=<id>` para abrir una ficha. |
| `/como-viajas` | Asistente de **2 páginas** a pantalla completa (el viaje y tus datos). Progreso arriba, Intro para avanzar, resumen, validación y pantalla de confirmación con referencia. Acepta `?paso=<n>`. |
| `/ofertas` | Ofertas de temporada activas y la comunidad de WhatsApp. |
| `/contacto` | Datos de contacto, horario y formulario corto de 4 campos. |
| `/aviso-legal`, `/privacidad`, `/cookies`, `/creditos` | Páginas legales y créditos fotográficos. |
| `/admin/login` | Acceso al panel (usuario y contraseña de la base de datos; sesión de 12 h). |
| `/admin/solicitudes` | Solicitudes del asistente: listado paginado (10) con filtro por estado y búsqueda, detalle en línea con estado, notas, respuestas, brief `.txt`, correos enviados, redactor que envía por SMTP y botón de **eliminar** (RGPD). |
| `/admin/contactos` | Mensajes del formulario corto: marcar atendido, responder, eliminar. |
| `/admin/destinos` | Destinos: textos, coordenadas, portada, imagen (subida al servidor), orden. |
| `/admin/ofertas` | Ofertas: alta, edición, activar/ocultar, orden, imagen. |
| `/admin/preguntas` | Páginas del asistente: títulos, textos, etiquetas, máximo de opciones y opciones. |
| `/admin/textos` | Bloques de texto de la web: marca y contacto (teléfono, WhatsApp, comunidad), menú, portada, método, equipo, cierre, mapa, contacto, ofertas, pie. |
| `/admin/cuenta` | Cambio de contraseña. |
| `POST /api/solicitudes` | Recibe el asistente, valida con zod, guarda la solicitud y su brief en la base de datos y envía la confirmación al cliente y el aviso a la agencia. |
| `POST /api/contacto` | Recibe el formulario corto, lo guarda y avisa a la agencia. |
| `/api/admin/*` | API del panel (requiere sesión): solicitudes, contactos, destinos, ofertas, preguntas, textos, media (subida de imágenes), cuenta. |
| `/api/auth/*` | Auth.js (login/logout). |
| `GET /api/health` | Comprobación de salud (web + base de datos). |

La selección del mapa y las respuestas del asistente se guardan en `localStorage` (`tb:seleccion`, `tb:formulario`) hasta que se envían, así el usuario no pierde nada al recargar o al ir del mapa al formulario.

## Stack

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Front y backend | **Next.js 16** (App Router, Route Handlers) + **React 19** + **TypeScript** | Un solo proyecto y un solo contenedor: web pública, API y panel comparten tipos y validación. |
| Base de datos | **PostgreSQL 16** + **Prisma 7** (`@prisma/adapter-pg`) | Migraciones versionadas, cliente tipado, JSONB para respuestas y bloques de texto. |
| Autenticación | **Auth.js v5** (Credentials + bcryptjs, sesión JWT en cookie) | Uno o pocos administradores, sin OAuth. `src/proxy.ts` protege `/admin/**` y `/api/admin/**`. |
| Correo | **Nodemailer** por SMTP (Brevo, Resend, Gmail…) | Las plantillas HTML con la marca ya existían; ahora las envía el servidor. |
| Imágenes | **sharp** | Las subidas se convierten a WebP (máx. 1600 px) y se guardan en `data/uploads`. |
| Estilos | **Tailwind CSS 4** + CSS propio (`src/app/globals.css`) | Tokens del sistema visual en variables CSS; utilidades solo para layout. |
| Animación | **GSAP 3 + ScrollTrigger** | Scrub de titulares, parallax, contadores, cascadas y el avión de transición. |
| Validación | **zod** | Mismo esquema en cliente y servidor (`src/lib/validation.ts`, `src/lib/validation-admin.ts`). |
| Mapa | `world-atlas` + `d3-geo` (solo en build) | `scripts/build-map.mjs` pre-proyecta un path por país y los marcadores; el bundle no incluye d3. |
| Despliegue | **Docker Compose** (`db` + `web`) + **Nginx** + certbot | `docker compose up -d --build`; el contenedor aplica las migraciones y el seed al arrancar. |

## Cómo fluye el contenido

- `src/lib/content.ts` es el único punto por el que las páginas leen contenido (`getSiteContent()`, `getFormContent()`). Con `DATABASE_URL` lee de la base de datos (destinos, ofertas, páginas del formulario y bloques de texto) y lo fusiona sobre los estáticos de `src/data/*`; el resultado se cachea con la etiqueta `content` y el admin la invalida al guardar. Sin `DATABASE_URL` (demo de GitHub Pages, desarrollo sin base de datos) devuelve los estáticos tal cual.
- `src/data/*` sigue siendo la **fuente del seed** y el valor por defecto de cada bloque. Para cambiar textos en producción se usa el panel; para cambiar los valores iniciales de un despliegue nuevo, los ficheros.
- Las páginas públicas se renderizan por petición (`connection()` en el layout) y los datos salen de la caché, así cualquier cambio del admin se ve al recargar.

## Panel de administración

- Login con Auth.js (`src/auth.ts`): correo y contraseña de la tabla `AdminUser` (bcrypt, coste 12). La cookie es `httpOnly`, `sameSite=lax`, `secure` con HTTPS, y caduca a las 12 h. El usuario inicial lo crea el seed con `ADMIN_EMAIL`/`ADMIN_PASSWORD`; cámbiala desde **Cuenta**.
- Cada página del panel carga los datos en el servidor (`src/lib/repo/*`) y los componentes (`src/components/admin/*`) hablan con `/api/admin/*` a través de `src/lib/admin/api.ts`. `src/components/admin/sources.tsx` define la «fuente» de cada sección: base de datos (VPS) o `localStorage` (demo estática).
- Las mutaciones van por Route Handlers y no por Server Actions porque la demo de GitHub Pages es una exportación estática, donde las Server Actions no compilan.
- Cada ruta de `/api/admin/*` comprueba la sesión en el servidor (no basta el proxy) y valida la entrada con zod.

## Correo

`src/lib/mailer.ts` envía por SMTP con las variables `SMTP_*` y `MAIL_FROM`/`MAIL_AGENCY`:

- **Confirmación al cliente** (`clientConfirmationEmail`) y **aviso a la agencia** (`agencyRequestEmail`, con el brief completo en la versión de texto) al recibir una solicitud; **aviso a la agencia** (`agencyContactEmail`) al recibir un contacto. Se envían después de responder al navegador (`after()`), así el formulario no espera al SMTP.
- **Mensaje del gestor** (`clientMessageEmail`) desde la ficha de cada solicitud en el panel, con vista previa en vivo.
- Todo envío deja traza en `MessageLog` (enviado / error / sin SMTP). Sin `SMTP_HOST` la web funciona igual y los correos quedan registrados como «skipped».

En la demo estática no hay servidor: los botones de correo abren el programa de correo del visitante con un `mailto:` (`src/lib/mailto.ts`).

## Base de datos

Modelos (`prisma/schema.prisma`): `AdminUser`, `Destination`, `Offer`, `FormStep`, `SiteSetting`, `Solicitud`, `Contacto`, `MessageLog`, `MediaAsset`. Las respuestas del asistente van en JSONB tal cual (`Solicitud.data`), con el brief en `Solicitud.prompt` y copias desnormalizadas de nombre/correo/teléfono para buscar.

```bash
npm run db:generate   # cliente Prisma (src/generated/prisma, ignorado por git)
npm run db:migrate    # crea/aplica migraciones en desarrollo (prisma migrate dev)
npm run db:deploy     # aplica migraciones en producción (lo hace el contenedor al arrancar)
npm run db:seed       # destinos, ofertas, formulario, textos, admin inicial e importación de data/*.json
npm run db:studio     # Prisma Studio
```

El seed es idempotente: solo crea lo que falta. Si existen ficheros `data/solicitudes/*.json` o `data/contacto/*.json` de la versión sin base de datos, los importa.

## Estructura

```
src/
  app/                       rutas: /, /donde-nos-vamos, /como-viajas, /ofertas, /contacto, legales, admin/*, api/*
  auth.ts, auth.config.ts    Auth.js (credenciales + sesión JWT)
  proxy.ts                   puerta de /admin/** y /api/admin/** (en Next 16 el middleware se llama proxy)
  components/
    layout/ motion/ sections/ map/ form/ contact/
    admin/                   panel: AdminShell/AdminNav, *Admin (listas), *Editor, sources.tsx (fuentes de datos)
  data/                      site.ts, destinations.json, ofertas.json, form.ts (valores iniciales y seed)
  lib/
    content.ts               capa de contenido (BD con caché por etiqueta, o estáticos)
    db.ts                    cliente Prisma (singleton)
    repo/                    acceso a datos: solicitudes, contactos, destinos, ofertas, form, settings, media, users
    mailer.ts                envío SMTP + traza en MessageLog
    rate-limit.ts            límite por IP y campo trampa de las rutas públicas
    uploads.ts               rutas de las imágenes subidas
    validation*.ts           esquemas zod (público y admin)
    admin/                   api.ts (cliente de /api/admin), session.ts, data.ts (demo), image.ts (subida)
  types/                     content.ts, form.ts, admin.ts
prisma/                      schema.prisma, migrations/, seed.ts
deploy/                      nginx.conf, docker-entrypoint.sh, backup.sh
docs/                        PLAN-BACKEND.md, OPERACION.md
```

## Desarrollo

```bash
npm install
cp .env.example .env         # DATABASE_URL de un PostgreSQL local, AUTH_SECRET, ADMIN_EMAIL/ADMIN_PASSWORD…
npm run db:migrate && npm run db:seed
npm run dev                  # http://localhost:3000  (admin en /admin/login)
npm run lint && npx tsc --noEmit
npm run build && npm start
```

Sin `DATABASE_URL` la web arranca con los datos estáticos y sin panel operativo. Para probar el correo en local sin un proveedor, cualquier servidor SMTP de pruebas sirve (`SMTP_HOST=127.0.0.1`, `SMTP_PORT=2525`).

Scripts auxiliares:

```bash
node scripts/build-logo.mjs   # regenera el logo blanco y el icono desde public/brand/logo-source.png
node scripts/build-map.mjs    # regenera src/generated/world-map.json tras tocar src/data/destinations.json
node scripts/fetch-media.mjs scripts/mi-manifiesto.json   # descarga y convierte a WebP un manifiesto {nombre: url}
node scripts/build-hero-video.mjs   # une los clips de scratch/hero en public/media/hero.mp4 y genera el poster
```

## Editar contenido

- En producción, desde el panel: **Destinos**, **Ofertas**, **Preguntas** y **Textos**. Las imágenes subidas van a `data/uploads/AAAA/MM/` y se sirven en `/uploads/…`; las 12 fotos originales siguen en `public/media/real-*.webp`.
- Valores iniciales (seed) y demo estática: `src/data/site.ts` (textos), `src/data/destinations.json` (+ `node scripts/build-map.mjs`), `src/data/ofertas.json`, `src/data/form.ts`.
- Fotografías reales de destinos: `scripts/commons-queries.json` + `node scripts/fetch-commons.mjs scripts/commons-queries.json` actualiza `public/media/credits.json`.
- Nombres de países en español para el mapa: `src/data/country-names.es.json`.

## Demo en GitHub Pages

El workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publica una versión **estática de demostración** en `https://<usuario>.github.io/<repo>/` con cada push a `main`. Activa una vez en el repositorio: *Settings → Pages → Source: GitHub Actions*.

En esa versión no hay servidor: el workflow elimina `src/app/api` y `src/proxy.ts` antes del build (`DEPLOY_TARGET=pages`) y los formularios y el panel funcionan en modo demo (`NEXT_PUBLIC_STATIC_DEMO=1`): la solicitud se guarda solo en el navegador, la pantalla final ofrece descargar el brief `.txt`, y el panel (`admin` / `turista2026`) guarda los cambios en `localStorage`. Los enlaces y recursos llevan el prefijo del repositorio (`NEXT_PUBLIC_BASE_PATH`).

Para probar la exportación en local, aparta temporalmente `src/app/api` y `src/proxy.ts` (por ejemplo moviéndolos a `/tmp`), ejecuta

```bash
DEPLOY_TARGET=pages NEXT_PUBLIC_BASE_PATH=/turistabybonestarV2 NEXT_PUBLIC_STATIC_DEMO=1 npm run build
```

y devuélvelos a su sitio; el resultado queda en `out/`.

## Despliegue en el VPS (Docker Compose + Nginx)

1. Instala Docker (con el plugin Compose) y Nginx en el servidor y apunta el dominio a su IP.
2. Clona el proyecto en `/opt/turistabybonestar` y crea `.env` a partir de `.env.example`: `POSTGRES_PASSWORD`, `DATABASE_URL` (con esa misma contraseña y host `db`), `AUTH_SECRET` (`openssl rand -base64 32`), `ADMIN_EMAIL`/`ADMIN_PASSWORD` (solo para el primer arranque), `SMTP_*`, `MAIL_FROM`, `MAIL_AGENCY`, `NEXT_PUBLIC_SITE_URL`, `AUTH_URL`.
3. Si tienes solicitudes de la versión anterior, deja sus JSON en `data/solicitudes/` y `data/contacto/`: el seed los importa.
4. Construye y arranca: `docker compose up -d --build`. El contenedor `web` espera a que `db` esté sano, ejecuta `prisma migrate deploy`, el seed (idempotente) y arranca Next en `127.0.0.1:3000`. Comprueba `curl localhost:3000/api/health`.
5. Copia `deploy/nginx.conf` a `/etc/nginx/sites-available/`, ajusta el dominio y la ruta del `alias` de `/uploads/`, enlázalo en `sites-enabled` y recarga Nginx.
6. Certificado TLS: `sudo certbot --nginx -d turistabybonestar.com -d www.turistabybonestar.com`.
7. Copias de seguridad: `crontab -e` → `15 3 * * * cd /opt/turistabybonestar && ./deploy/backup.sh >> backups/backup.log 2>&1` (volcado diario de PostgreSQL + tar de `data/uploads`, retención 14 días).
8. Entra en `https://turistabybonestar.com/admin/login` con `ADMIN_EMAIL`/`ADMIN_PASSWORD` y cambia la contraseña en **Cuenta**.

Para actualizar: `git pull && docker compose up -d --build`. La base de datos (volumen `pgdata`) y `data/uploads` sobreviven a los redespliegues y a los reinicios del servidor (`restart: unless-stopped`). Registro: `docker compose logs -f web`.

Cabeceras de seguridad (`next.config.ts`): `Content-Security-Policy` básica (recursos propios + WhatsApp + Nominatim), `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options` (`DENY` en el panel). Las rutas públicas limitan a 5 envíos por IP cada 10 minutos y llevan un campo trampa para bots.

La guía de operación (entrar al admin, copias, restaurar, tareas de mantenimiento) está en [`docs/OPERACION.md`](docs/OPERACION.md).
