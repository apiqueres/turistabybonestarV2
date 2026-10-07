# Plan de backend · TuristaByBonestar

> Documento de trabajo para implementar el backend en el VPS. Está pensado para pasárselo a Claude
> (o a cualquier desarrollador) junto con el repositorio. Antes de tocar código, lee `AGENTS.md`:
> la versión de Next.js (16) tiene cambios respecto a lo habitual y la documentación válida está en
> `node_modules/next/dist/docs/`.

## 0. Punto de partida (lo que ya existe)

El front está terminado y preparado para enchufar un backend sin rehacer la interfaz:

| Pieza | Dónde está hoy | Qué hace |
| --- | --- | --- |
| Contenido del sitio | `src/data/site.ts`, `src/data/destinations.json`, `src/data/ofertas.json`, `src/data/form.ts` | Textos, 12 destinos, ofertas y las dos páginas del formulario |
| Capa de contenido | `src/lib/content.ts` → `getSiteContent()`, `getFormContent()` | Único punto por el que las páginas leen contenido. **Es la costura para el backend** |
| Tipos | `src/types/content.ts`, `src/types/form.ts` | `SiteContent`, `Destination`, `Offer`, `FormStep`, `Question`… |
| Validación | `src/lib/validation.ts` (zod) | `solicitudSchema`, `contactoSchema`, compartidos por front y API |
| API pública | `src/app/api/solicitudes/route.ts`, `src/app/api/contacto/route.ts` | Guardan JSON (+ brief `.txt`) en `DATA_DIR` vía `src/lib/store.ts` |
| Brief para el gestor | `src/lib/prompt.ts` → `buildPrompt()` | Texto plano con la solicitud, listo para preparar la propuesta |
| Correo | `src/lib/email-shell.ts`, `src/lib/email-templates.ts`, `src/lib/email.ts` | Plantillas HTML con la marca (confirmación al cliente, mensaje del gestor). Envío **desde el navegador** con EmailJS o `mailto:` (demo) |
| Admin (mockup) | `src/app/admin/**`, `src/components/admin/**`, `src/lib/admin/*` | Login demo (`admin` / `turista2026`), secciones Solicitudes, Destinos, Ofertas, Preguntas. Todo en `localStorage` |
| Hooks del admin | `src/lib/admin/data.ts` → `useRequests`, `useDestinations`, `useOffers`, `useFormSteps` | **Segunda costura**: los componentes del admin solo hablan con estos hooks |
| Imágenes del admin | `src/lib/admin/image.ts` | Redimensiona en el navegador y guarda `data:` URL en localStorage |
| Despliegue | `Dockerfile` (standalone), `docker-compose.yml` (volumen `./data`), `deploy/nginx.conf` | Un contenedor Next detrás de Nginx con TLS |
| Demo estática | `.github/workflows/pages.yml`, `NEXT_PUBLIC_STATIC_DEMO=1` | GitHub Pages sin API (el workflow borra `src/app/api`). **Debe seguir funcionando** |

Formas de datos que ya existen y que el backend debe respetar:

- `SolicitudInput` (zod): `{ destinos: [{ id, nombre }], respuestas: Record<string, string | string[] | number | boolean>, contacto: { nombre, email, telefono, canal, privacidad: true } }`.
  El `id` de destino es el numérico ISO del país (`"392"`), `c<geonameid>` para ciudades del índice o `o<osm_id>` si vino de OpenStreetMap.
- `StoredRequest` (`src/data/mock-solicitudes.ts`): `{ id, createdAt, data: SolicitudInput, status: "nueva" | "en-curso" | "cerrada", notes? }`.
- `ContactoInput`: `{ nombre, email, telefono?, mensaje, privacidad: true }`.
- `Destination`, `Offer`, `FormStep`/`Question` tal cual están en `src/types`.

## 1. Decisiones de arquitectura (recomendación)

| Tema | Decisión | Por qué |
| --- | --- | --- |
| Dónde vive el backend | **Dentro del mismo proyecto Next.js** (Route Handlers + Server Actions + componentes de servidor). Sin servicio NestJS aparte | Un solo contenedor, un solo despliegue, los tipos y zod se comparten sin duplicar. El volumen de la agencia no justifica dos servicios |
| Base de datos | **PostgreSQL 16** en un contenedor del mismo `docker-compose` | Robusta, backups sencillos con `pg_dump`, JSONB para las respuestas del formulario y los bloques de texto |
| ORM | **Prisma** (`prisma`, `@prisma/client`) | Migraciones versionadas, cliente tipado, seed en TypeScript |
| Autenticación del admin | **Auth.js v5** (`next-auth@beta`) con proveedor *Credentials*, contraseñas con `bcryptjs`, sesión en cookie JWT, `middleware.ts` protegiendo `/admin/**` y `/api/admin/**` | Un usuario (o pocos) de la agencia, sin OAuth. Se puede añadir 2FA después |
| Correo | **Nodemailer por SMTP desde el servidor** (`src/lib/mailer.ts`). Proveedor: Brevo/Resend/SMTP de Gmail con contraseña de aplicación | Las plantillas HTML ya existen; solo cambia quién envía. Se elimina EmailJS del front |
| Imágenes | Subida al servidor, procesado con `sharp` a WebP (máx. 1600 px) y guardado en el volumen `/app/data/uploads`, servido por Nginx en `/uploads/` | Sin dependencia de terceros; `sharp` ya está en el proyecto (pasar a `dependencies`) |
| Caché de páginas | Páginas públicas renderizadas en servidor con revalidación por etiqueta: cada guardado del admin llama a `revalidateTag`/`revalidatePath` | Las páginas siguen siendo rápidas y el admin ve el cambio al instante |
| Demo en Pages | `getSiteContent()` y el admin mantienen el camino actual cuando no hay `DATABASE_URL` (`NEXT_PUBLIC_STATIC_DEMO=1`) | La demo pública sigue viva mientras se desarrolla |

## 2. Modelo de datos (Prisma)

```prisma
// prisma/schema.prisma (resumen; completar enums y @@index)
model AdminUser {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  lastLoginAt  DateTime?
}

model Destination {
  id         String   @id            // ISO numérico ("392"), igual que hoy
  slug       String   @unique
  name       String
  code       String
  region     String
  lon        Float
  lat        Float
  tagline    String
  bestSeason String
  duration   String
  idealFor   String
  badge      String?
  includes   String[]
  imageSrc   String
  imageAlt   String
  featured   Boolean  @default(false)
  sortOrder  Int      @default(0)
  active     Boolean  @default(true)
  updatedAt  DateTime @updatedAt
  offers     Offer[]
}

model Offer {
  id            String      @id @default(cuid())
  slug          String      @unique
  title         String
  destinationId String
  destination   Destination @relation(fields: [destinationId], references: [id])
  price         String
  priceNote     String
  dates         String
  duration      String
  text          String
  includes      String[]
  imageSrc      String
  imageAlt      String
  badge         String?
  active        Boolean     @default(true)
  sortOrder     Int         @default(0)
  updatedAt     DateTime    @updatedAt
}

model FormStep {              // las páginas del formulario y sus preguntas
  id        String @id       // "viaje", "contacto"
  sortOrder Int
  data      Json             // FormStep completo (kicker, title, text, hint, questions[])
  updatedAt DateTime @updatedAt
}

model SiteSetting {           // bloques de texto editables de SiteContent
  key       String @id       // "brand", "nav", "home.hero", "home.method", "about", "pain", "team", "closing", "map", "offers", "contact", "footer"
  data      Json
  updatedAt DateTime @updatedAt
}

model Solicitud {
  id        String   @id            // mismo formato que hoy: <iso-fecha>_<8 hex>
  createdAt DateTime @default(now())
  status    RequestStatus @default(nueva)
  notes     String?
  data      Json                    // SolicitudInput validado
  prompt    String                  // brief .txt generado con buildPrompt()
  email     String                  // copia desnormalizada para buscar
  phone     String
  messages  MessageLog[]
  @@index([createdAt]) @@index([status]) @@index([email])
}
enum RequestStatus { nueva en_curso cerrada }

model Contacto {
  id        String   @id
  createdAt DateTime @default(now())
  data      Json                    // ContactoInput
  handled   Boolean  @default(false)
}

model MessageLog {             // correos enviados (confirmaciones y mensajes del gestor)
  id          String    @id @default(cuid())
  createdAt   DateTime  @default(now())
  solicitudId String?
  solicitud   Solicitud? @relation(fields: [solicitudId], references: [id])
  to          String
  subject     String
  kind        String              // "confirmacion" | "admin" | "aviso-agencia"
  status      String              // "sent" | "error"
  error       String?
}

model MediaAsset {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  path      String   @unique        // "/uploads/2026/10/xxxx.webp"
  width     Int
  height    Int
  bytes     Int
  alt       String?
}
```

Notas:

- `status` del admin usa hoy `"en-curso"` con guion; en la base de datos es `en_curso`. Mapear en la capa de acceso para no tocar los componentes.
- Las respuestas del formulario (`data.respuestas`) van en JSONB tal cual: las preguntas son editables desde el admin y no conviene una columna por pregunta.
- `SiteSetting.data` guarda cada bloque de `SiteContent` con la misma forma que `src/data/site.ts`, así `getSiteContent()` puede hacer `{ ...siteContent, ...bloquesDeLaBD }` sin transformar nada.

## 3. Contrato de la API

Rutas públicas (sin sesión), con validación zod y límite de peticiones por IP:

| Método y ruta | Entrada | Salida | Efectos |
| --- | --- | --- | --- |
| `POST /api/solicitudes` | `SolicitudInput` | `{ ok, id, prompt }` (igual que hoy) | Inserta `Solicitud` + `prompt`; envía correo de confirmación al cliente y aviso a la agencia; registra `MessageLog` |
| `POST /api/contacto` | `ContactoInput` | `{ ok, id }` | Inserta `Contacto`; aviso a la agencia |
| `GET /api/content` *(opcional)* | — | `SiteContent` | Solo si en el futuro otro front lo necesita; las páginas leen directamente de la BD en servidor |

Rutas del admin (requieren sesión de Auth.js; prefijo `/api/admin/*` o Server Actions equivalentes):

| Recurso | Operaciones |
| --- | --- |
| `solicitudes` | listar (paginado de 10, filtros por estado y texto), ver una, cambiar `status`, editar `notes`, **enviar correo al cliente** (`POST /api/admin/solicitudes/:id/mensaje` con `{ subject, intro, body, closing }` → usa `clientMessageEmail`), descargar brief `.txt` |
| `contactos` | listar, marcar atendido |
| `destinos` | listar, crear, editar, borrar, reordenar, marcar destacado |
| `ofertas` | listar, crear, editar, borrar, activar/ocultar, reordenar |
| `preguntas` | leer y guardar las dos páginas del formulario (`FormStep[]`) |
| `textos` | leer y guardar cada bloque de `SiteSetting` (hero, método, equipo, cierre, contacto, footer, marca) |
| `media` | `POST /api/admin/media` (multipart) → `{ path, width, height }`; `DELETE` |
| `cuenta` | cambiar contraseña |

Recomendación: implementar las mutaciones del admin como **Server Actions** (`src/lib/admin/actions/*.ts` con `"use server"`) y dejar como Route Handlers solo lo que necesite URL propia (subida de imágenes, descarga del `.txt`, API pública). Las Server Actions ya traen protección de origen y se llaman desde los componentes existentes sin montar un cliente HTTP.

## 4. Cómo se enchufa al front (sin rehacer la interfaz)

1. **Contenido público** — `src/lib/content.ts`:
   - Si no hay `DATABASE_URL` (demo en Pages o desarrollo sin BD): devolver `siteContent`/`formContent` estáticos como hoy.
   - Si la hay: leer `SiteSetting`, `Destination` (activos, por `sortOrder`), `Offer` (activas) y `FormStep`, y fusionar sobre los estáticos. Cachear con etiqueta (`"content"`) y revalidar al guardar desde el admin.
   - Mantener `withBasePath()` y los contratos `SiteContent`/`FormContent`.
2. **Formulario y contacto** — `src/app/api/solicitudes/route.ts` y `contacto/route.ts`: sustituir `saveRecord()` por el repositorio de Prisma y añadir el envío de correo en servidor. La respuesta no cambia, así `Wizard.tsx` sigue igual (modo `STATIC_DEMO` incluido).
3. **Admin** — `src/lib/admin/data.ts`: los cuatro hooks pasan a leer de la BD. Camino recomendado: convertir las páginas de `src/app/admin/(panel)/*/page.tsx` en componentes de servidor que cargan los datos y se los pasan a los componentes actuales (`RequestsAdmin`, `DestinationsAdmin`, `OffersAdmin`, `QuestionsAdmin`), y que estos llamen a Server Actions en lugar de `save()` de localStorage. Mantener `Pager`, `paginate()` y la edición en línea (el cliente no quiere paneles laterales).
4. **Login** — `src/lib/admin/auth.ts` y `LoginForm.tsx`: sustituir por `signIn("credentials")` de Auth.js; `AdminShell` lee la sesión del servidor. Eliminar `DEMO_CREDENTIALS`.
5. **Correo** — `MessageComposer.tsx`: en lugar de `sendDemoMail` (EmailJS en el navegador) llama a la acción `enviarMensajeCliente(solicitudId, mensaje)`. Las plantillas de `email-templates.ts` se reutilizan tal cual en servidor. Borrar `src/lib/email.ts` y las variables `NEXT_PUBLIC_EMAILJS_*`.
6. **Imágenes** — `DestinationEditor`/`OfferEditor`: el `<input type="file">` sube a `/api/admin/media` y guarda la ruta devuelta en `image.src` (hoy guarda un `data:` URL). `fileToDataUrl` puede quedarse para la previsualización inmediata.
7. **Sembrado** — `prisma/seed.ts` importa `destinations.json`, `ofertas.json`, `form.ts`, los bloques de `site.ts` y, si existen, los `data/solicitudes/*.json` y `data/contacto/*.json` guardados por la versión actual (misma forma que `Solicitud.data`).

## 5. Fases de trabajo (cada una termina con `npx tsc --noEmit && npm run lint && npm run build` en verde)

### Fase 1 · Base de datos y esquema
- Añadir `prisma`, `@prisma/client`, `bcryptjs`, `nodemailer`, `next-auth@beta`; pasar `sharp` a `dependencies`.
- `prisma/schema.prisma` según el apartado 2; `npx prisma migrate dev --name init`.
- `src/lib/db.ts` (cliente Prisma singleton) y repositorios finos en `src/lib/repo/*.ts` (`solicitudes.ts`, `destinos.ts`, `ofertas.ts`, `form.ts`, `settings.ts`, `media.ts`).
- `prisma/seed.ts` + script `npm run db:seed`; crea el usuario admin desde `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- **Hecho cuando**: la base arranca en Docker, el seed carga los 12 destinos, 4 ofertas, 2 páginas del formulario y los textos.

### Fase 2 · Entradas públicas y correo
- `src/lib/mailer.ts` (Nodemailer + SMTP de `.env`), `sendClientConfirmation()`, `notifyAgency()`.
- Reescribir las dos rutas públicas sobre Prisma; conservar `buildPrompt()` y guardar el brief en `Solicitud.prompt`.
- Límite de peticiones (p. ej. 5 por IP y 10 minutos, en memoria) y campo trampa anti-bots en el payload (ignorado por zod si va vacío).
- **Hecho cuando**: enviar el formulario desde la web crea la fila, llega el correo de confirmación al cliente y el aviso a la agencia, y el `.txt` se puede descargar desde el admin.

### Fase 3 · Autenticación
- Auth.js con Credentials, `src/auth.ts`, `src/middleware.ts` (matcher `/admin/:path*`, `/api/admin/:path*`; `/admin/login` libre).
- Cookies `secure`, `httpOnly`, `sameSite=lax`; expiración de 12 h; `AUTH_SECRET` en `.env`.
- Pantalla de cambio de contraseña.
- **Hecho cuando**: sin sesión, `/admin/solicitudes` redirige al login; con sesión, entra; el usuario demo ya no existe.

### Fase 4 · Admin sobre la base de datos
- Solicitudes: listado paginado de 10 con filtros, detalle en línea (estado, notas, respuestas, brief, redactor de correo que envía desde el servidor y deja traza en `MessageLog`).
- Destinos, Ofertas, Preguntas: CRUD con edición en línea, reordenación y revalidación de caché al guardar.
- Nueva sección **Textos** para los bloques de `SiteSetting` (hero, método, a quién nos dirigimos, dolor real, equipo, cierre, contacto, footer, marca y enlaces de WhatsApp/comunidad).
- Nueva sección **Contactos** (mensajes del formulario corto).
- **Hecho cuando**: cualquier cambio hecho en el admin se ve en la web pública al recargar, y nada del admin depende ya de `localStorage` salvo preferencias de interfaz.

### Fase 5 · Imágenes
- `POST /api/admin/media`: valida tipo y tamaño (≤ 10 MB), procesa con `sharp` (WebP, máx. 1600 px, calidad 82), guarda en `/app/data/uploads/AAAA/MM/`, registra `MediaAsset`.
- Nginx: `location /uploads/ { alias /ruta/en/el/host/data/uploads/; expires 7d; }`.
- Las 12 fotos actuales de `public/media/real-*.webp` siguen sirviéndose desde `public/`; solo las nuevas van a `uploads`.
- **Hecho cuando**: subir una foto en un destino la muestra en la portada y en el mapa.

### Fase 6 · Despliegue, copias y vigilancia
- `docker-compose.yml`: servicios `db` (postgres:16-alpine, volumen `pgdata`, `healthcheck`) y `web` (`depends_on: db: condition: service_healthy`); el contenedor `web` ejecuta `prisma migrate deploy` antes de `node server.js` (`docker-entrypoint.sh`).
- Copias: `deploy/backup.sh` con `pg_dump` diario a `./backups/` (retención 14 días) + `tar` de `data/uploads`; cron en el host.
- Registro: `console.error` con prefijo por módulo (ya se usa) y `docker compose logs`; opcional `healthcheck` HTTP en `/api/health`.
- Actualizar `README.md` (sección «Despliegue en el VPS») y `.env.example`.
- **Hecho cuando**: `docker compose up -d --build` en el VPS deja la web y el admin funcionando tras un reinicio del servidor.

### Fase 7 · Limpieza
- Quitar `src/lib/store.ts`, `src/data/mock-solicitudes.ts`, EmailJS y las claves `tb:admin-*` de `src/lib/admin/keys.ts` (solo cuando `NEXT_PUBLIC_STATIC_DEMO` no esté activo; la demo de Pages puede conservar un juego de datos de muestra).
- Revisar que el workflow de Pages siga compilando: `prisma`/`nodemailer` no pueden acabar en el bundle del cliente y `content.ts` debe seguir devolviendo los estáticos sin `DATABASE_URL`.

## 6. Variables de entorno (`.env` en el VPS)

```bash
# Sitio
NEXT_PUBLIC_SITE_URL=https://turistabybonestar.com

# Base de datos
POSTGRES_USER=tbb
POSTGRES_PASSWORD=<generar>
POSTGRES_DB=turistabybonestar
DATABASE_URL=postgresql://tbb:<password>@db:5432/turistabybonestar?schema=public

# Auth.js
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://turistabybonestar.com
ADMIN_EMAIL=turistasinlicenciabook@gmail.com   # usuario inicial creado por el seed
ADMIN_PASSWORD=<solo para el primer seed; cambiar desde el admin>

# Correo (SMTP del proveedor elegido)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<usuario>
SMTP_PASS=<clave>
MAIL_FROM="TuristaByBonestar <hola@turistabybonestar.com>"
MAIL_AGENCY=turistasinlicenciabook@gmail.com   # recibe los avisos de solicitudes y contactos

# Archivos
DATA_DIR=/app/data            # uploads y copias
UPLOAD_MAX_MB=10
```

## 7. Seguridad y buenas prácticas que debe cumplir la implementación

- Toda entrada pasa por zod (`src/lib/validation.ts`); los esquemas existentes no se relajan.
- Contraseñas con `bcryptjs` (coste 12); nunca se registran en logs; el seed no deja la contraseña inicial en la base en claro.
- Las rutas `/api/admin/*` y las Server Actions comprueban la sesión en servidor en cada llamada (no basta el middleware).
- Límite de peticiones en las rutas públicas y tamaño máximo de cuerpo (Nginx ya tiene `client_max_body_size 20m`).
- Subidas: comprobar el tipo real del archivo con `sharp` (no solo la extensión), renombrar con id aleatorio, no servir nunca desde una ruta que permita `..`.
- Datos personales: las solicitudes contienen nombre, correo y teléfono. Añadir en el admin un botón «Eliminar solicitud» (borrado real) para atender derechos RGPD, y una tarea opcional que anonimice las cerradas con más de 24 meses.
- Cabeceras: `X-Frame-Options`/`frame-ancestors` para el admin, `Referrer-Policy`, `Content-Security-Policy` básica (permitir `wa.me`, `chat.whatsapp.com`, `nominatim.openstreetmap.org` en `connect-src`).
- Los secretos solo viven en `.env` del VPS (fuera del repositorio); `.env.example` documenta las claves sin valores.

## 8. Fuera de alcance (para una fase posterior)

- Pagos o reservas en línea.
- Varios usuarios con roles distintos (hoy basta uno o dos administradores con el mismo permiso).
- Multidioma.
- Panel de estadísticas (se puede empezar con consultas SQL sobre `Solicitud`).

## 9. Instrucciones para quien lo implemente

1. Clona el repositorio en el VPS y lee `AGENTS.md`, `README.md` y este documento.
2. Trabaja en una rama `backend`; cada fase es un commit o PR con su descripción.
3. No cambies la interfaz pública ni el aspecto del admin salvo lo indicado (nueva sección Textos y Contactos, botón de eliminar solicitud).
4. Antes de dar por cerrada una fase: `npx tsc --noEmit`, `npm run lint`, `npm run build`, y una prueba manual del flujo completo (formulario → correo → admin).
5. Comprueba también `DEPLOY_TARGET=pages NEXT_PUBLIC_STATIC_DEMO=1 npm run build` (sin `src/app/api`, como hace el workflow) para que la demo de GitHub Pages no se rompa.
6. Al terminar, actualiza `README.md` y deja en `docs/` una guía corta de operación: cómo entrar al admin, dónde están las copias, cómo restaurar una.
