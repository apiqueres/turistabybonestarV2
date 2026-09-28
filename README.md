# TuristaByBonestar — Web

Web de la agencia de viajes a medida TuristaByBonestar (Sueca, Valencia). Estilo editorial premium en tema claro (blanco, negro y cian), con animaciones GSAP + ScrollTrigger. Las fotografías de los destinos son reales (Wikimedia Commons, licencias libres, ver `/creditos`); el vídeo hero, la foto de «Sobre nosotros», la del cierre y los retratos del equipo se generaron con Higgsfield.

## Rutas

| Ruta | Qué hay |
| --- | --- |
| `/` | Inicio: hero con vídeo, el método en 3 pasos, 6 destinos destacados, sobre nosotros con cifras, las 10 dimensiones que preguntamos, cómo se come + testimonio, equipo con panel lateral y cierre con doble CTA. |
| `/donde-nos-vamos` | Mapa mundial donde **cualquier país es seleccionable** (los 12 recomendados van en cian con marcador), barra "Tu lista" con chips y las 12 fichas de destino en pestañas. Al menos un país es obligatorio para continuar. Acepta `?pais=<id>` para abrir una ficha. |
| `/como-viajas` | Asistente de **8 pasos** a pantalla completa (ubicaciones, estilo, transporte, ritmo/alojamiento, mesa, cultura, fechas/presupuesto/viajeros, contacto). Progreso arriba, Intro para avanzar, resumen en el último paso, validación (destino obligatorio, nombre, correo y privacidad) y pantalla de confirmación con referencia. Acepta `?paso=<n>`. |
| `/contacto` | Datos de contacto, horario y formulario corto de 4 campos. |
| `/aviso-legal`, `/privacidad`, `/cookies` | Páginas legales (placeholders). |
| `POST /api/solicitudes` | Recibe el asistente, valida con zod y guarda `data/solicitudes/<id>.json` **y `<id>.txt`**, un brief legible para el gestor (prompt) con todas las respuestas en texto. |
| `/creditos` | Autoría y licencia de cada fotografía real. |
| `POST /api/contacto` | Recibe el formulario corto y guarda `data/contacto/<id>.json`. |

La selección del mapa y las respuestas del asistente se guardan en `localStorage` (`tb:seleccion`, `tb:formulario`) hasta que se envían, así el usuario no pierde nada al recargar o al ir del mapa al formulario.

## Stack

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Front | **Next.js 16** (App Router) + **React 19** + **TypeScript** | Un solo proyecto para la web pública, las rutas de API y, más adelante, el panel `/admin`. |
| Estilos | **Tailwind CSS 4** + CSS propio (`src/app/globals.css`) | Tokens del sistema visual en variables CSS; utilidades solo para layout. |
| Animación | **GSAP 3 + ScrollTrigger** | Scrub de titulares, parallax, contadores, cascadas y el avión de transición (también entre rutas y entre pasos del asistente). |
| Validación | **zod** | Mismo esquema en cliente y servidor (`src/lib/validation.ts`). |
| Mapa | `world-atlas` + `d3-geo` (solo en build) | `scripts/build-map.mjs` pre-proyecta un path por país y los marcadores; el bundle no incluye d3. |
| Despliegue | **Docker** (imagen `standalone`) + **Nginx** + certbot | Un contenedor en tu VPS detrás de Nginx, con `./data` montado como volumen. |

## Dónde se guardan las solicitudes

Mientras no exista el backend, cada envío es un fichero JSON:

```
data/
  solicitudes/2026-09-28T12-00-00-000Z_ab12cd34.json   ← asistente "Cómo viajas" (datos)
  solicitudes/2026-09-28T12-00-00-000Z_ab12cd34.txt    ← el mismo envío como brief/prompt legible
  contacto/2026-09-28T12-05-00-000Z_ef56gh78.json      ← formulario corto
```

Estructura del JSON: `{ id, createdAt, data: { destinos[{id, nombre}], respuestas{...}, contacto{...} }, prompt }`. El `.txt` (también incluido como `prompt` en el JSON) lo genera `src/lib/prompt.ts` traduciendo ids a etiquetas. Las claves de `respuestas` son los ids de pregunta de `src/data/form.ts`. La carpeta se configura con `DATA_DIR` (por defecto `./data`; en Docker, `/app/data` montado desde `./data`). Está en `.gitignore`.

Cuando llegue el admin, `src/lib/store.ts` es el único sitio que hay que sustituir por una base de datos (PostgreSQL + Prisma recomendado); los ficheros existentes se pueden importar tal cual.

## Estructura

```
src/
  app/                       rutas: /, /donde-nos-vamos, /como-viajas, /contacto, legales, api/*
  components/
    layout/                  Navbar (por rutas), Footer, SiteShell, SectionLabel, LegalPage
    motion/                  Loader, PlaneTransition, ScrubHeading
    sections/                secciones de la home
    map/                     CountryMap, SelectionBar, DestinationTabs, MapExperience
    form/                    Wizard, StepView, QuestionField, DestinationsStep, Summary, SuccessView
    contact/                 ContactForm
  data/site.ts               textos de todas las rutas
  data/destinations.json     los 12 destinos (id ISO numérico, ficha sin precios, lon/lat, imagen)
  data/form.ts               los 8 pasos del asistente
  generated/world-map.json   mapa pre-proyectado (no editar a mano)
  lib/                       content.ts (capa de datos), storage.ts, validation.ts, store.ts, gsap.ts, motion.ts, useMotion.ts
  types/                     content.ts, form.ts
public/brand/                logo blanco y fuente original
public/media/                vídeo hero y fotografías (Higgsfield)
scripts/                     build-logo.mjs, build-map.mjs, fetch-media.mjs
deploy/nginx.conf            ejemplo de proxy inverso
```

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build && npm start
```

Scripts auxiliares:

```bash
node scripts/build-logo.mjs   # regenera el logo blanco y el icono desde public/brand/logo-source.png
node scripts/build-map.mjs    # regenera src/generated/world-map.json tras tocar src/data/destinations.json
node scripts/fetch-media.mjs scripts/mi-manifiesto.json   # descarga y convierte a WebP un manifiesto {nombre: url}
node scripts/build-hero-video.mjs   # une los clips de scratch/hero (01-*.mp4 … 05-*.mp4) en public/media/hero.mp4 con fundidos y genera el poster
```

## Editar contenido

- Fotografías reales de destinos: `scripts/commons-queries.json` define la búsqueda en Wikimedia Commons de cada una; `node scripts/fetch-commons.mjs scripts/commons-queries.json` las descarga, convierte a WebP y actualiza `public/media/credits.json`. Para usar fotos propias basta con sustituir `public/media/real-<slug>.webp`.
- Nombres de países en español para el mapa: `src/data/country-names.es.json`.

- Textos de todas las rutas: `src/data/site.ts`.
- Destinos (añadir o quitar países disponibles): `src/data/destinations.json` y después `node scripts/build-map.mjs`. El `id` es el código ISO 3166-1 numérico del país.
- Preguntas del asistente: `src/data/form.ts`.
- Contacto, horario y año del copyright: `siteContent.brand`.

## Demo en GitHub Pages

El workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publica una versión **estática de demostración** en `https://<usuario>.github.io/<repo>/` con cada push a `main`. Activa una vez en el repositorio: *Settings → Pages → Source: GitHub Actions*.

En esa versión no hay servidor: las rutas de API se excluyen del build (`DEPLOY_TARGET=pages`) y los formularios funcionan en modo demo (`NEXT_PUBLIC_STATIC_DEMO=1`): la solicitud se guarda solo en el navegador y la pantalla final ofrece descargar el brief `.txt`. Los enlaces y recursos llevan el prefijo del repositorio (`NEXT_PUBLIC_BASE_PATH`).

Para probar la exportación en local:

```bash
rm -rf .next && mv src/app/api /tmp/api
DEPLOY_TARGET=pages NEXT_PUBLIC_BASE_PATH=/turistabybonestarV2 NEXT_PUBLIC_STATIC_DEMO=1 npm run build
mv /tmp/api src/app/api   # el resultado queda en out/
```

## Despliegue en el VPS (Docker + Nginx)

1. Instala Docker y Nginx en el servidor y apunta el dominio a su IP.
2. Clona el proyecto, crea `.env` a partir de `.env.example` y crea la carpeta `data/`.
3. Construye y arranca: `docker compose up -d --build` (escucha solo en `127.0.0.1:3000`).
4. Copia `deploy/nginx.conf` a `/etc/nginx/sites-available/`, ajusta el dominio, enlázalo en `sites-enabled` y recarga Nginx.
5. Certificado TLS: `sudo certbot --nginx -d turistabybonestar.com -d www.turistabybonestar.com`.

Para actualizar: `git pull && docker compose up -d --build`. Los JSON de `data/` sobreviven a los redespliegues.

## Fase 2: administración + backend (recomendación)

- Admin en `src/app/admin/**` en este mismo proyecto, protegido con **Auth.js**.
- API con Route Handlers (o **NestJS** aparte) sobre **PostgreSQL + Prisma**. Modelos iniciales: `Destination`, `Solicitud`, `Contacto`, `TeamMember`, `SiteSettings`.
- El front ya consume `SiteContent` y `FormContent` a través de `src/lib/content.ts`: basta con sustituir esas funciones por llamadas a la API para que todo sea editable desde el admin.
