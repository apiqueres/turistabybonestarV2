# Barra de promoción en la portada y banner de cookies

Fecha: 2026-10-08. Aprobado por el cliente en conversación.

## Objetivo

1. Desde /admin/ofertas se puede marcar **una sola** oferta como promoción de portada. Al entrar en la
   web, el visitante ve una barra horizontal dorada bajo la cabecera con el texto de la promoción, un
   enlace que lleva a esa oferta en /ofertas y una X para cerrarla.
2. Banner de consentimiento de cookies en todas las rutas, con enlace a /cookies y dos botones.

## Promoción de portada

### Datos

- `Offer` gana dos columnas: `promo Boolean @default(false)` y `promoText String?`.
  Migración de Prisma `add_offer_promo`.
- Tipo `Offer` del front: `promo: boolean` y `promoText?: string`. El repo `ofertas.ts` los mapea en
  `toFront`/`toRow`. `offerSchema` (zod) los valida: `promo` booleano, `promoText` corto opcional.
- El JSON estático `src/data/ofertas.json` y `EMPTY_OFFER` llevan `promo: false` para que la demo
  estática y el alta sigan tipando.

### Solo una a la vez

`upsertOffer` ejecuta en una transacción: si `o.promo` es verdadero, `updateMany({ where: { id: { not: o.id } }, data: { promo: false } })`
antes del `update`/`create`. El admin no tiene que desactivar la anterior a mano.

### Lectura

`getPromoOffer()` en `repo/ofertas.ts`: la oferta con `promo = true` y `active = true`, o `null`.
Se carga dentro de `loadFromDatabase` (misma caché etiquetada `content`) y se expone en
`SiteContent.promo: Offer | null`. En la demo estática (sin BD) se deriva de `offersList`.

### Admin

- `OfferEditor`: check "Mostrar como aviso en la portada (solo puede haber una)" y, debajo, el campo
  "Texto del aviso" con placeholder "Si lo dejas vacío: «Título · desde Precio»".
- `OffersAdmin`: en la columna Estado, etiqueta dorada "Portada" cuando `o.promo`.
- Al guardar, el mensaje de confirmación añade "Ahora es la promoción de portada." si procede.
- Modo demo (`OffersDemo`): al guardar con `promo` activado, desactiva `promo` en las demás en memoria.

### Barra (`components/layout/PromoBar.tsx`, cliente)

- Props: `offer: Offer | null`. Si es `null` no renderiza nada.
- Solo en la portada: el componente comprueba `usePathname() === "/"`. Se monta en `SiteShell` justo
  después de `Navbar`.
- Texto: `offer.promoText` o `"${offer.title} · desde ${offer.price}"`.
- Enlace "Ver oferta" a `/ofertas#oferta-${offer.id}`. `OffersGrid` pone `id={`oferta-${o.id}`}` y
  `scroll-margin-top` en cada `article` para que el ancla quede bajo la cabecera.
- Cerrar: botón con `aria-label="Cerrar aviso"`; guarda en `localStorage` la clave
  `tb:promo-cerrada` con el `id` de la oferta. Al montar, si el valor guardado coincide con el id
  actual, no se muestra. Una promo distinta vuelve a mostrarse.
- Sin parpadeo: estado inicial "oculta"; en `useEffect` se lee el almacenamiento y se abre con
  animación de deslizamiento (respeta `html.reduced-motion`, patrón ya usado en el sitio).
- Estilo (`globals.css`, bloque `.promo`): `position: fixed; top: var(--nav-h); left/right: 0;
  z-index: 48` (bajo la cabecera y el menú móvil), fondo `var(--gold)`, color `var(--ink)`, altura
  40px, tipografía mono en mayúsculas pequeñas como las etiquetas del sitio, texto en una línea con
  `text-overflow: ellipsis`, enlace subrayado, X a la derecha. Al ser fija sobre el hero a pantalla
  completa, no desplaza el contenido.

## Banner de cookies (`components/layout/CookieBanner.tsx`, cliente)

- Montado en `app/layout.tsx` después de `{children}`, así sale en todas las rutas.
- Clave `tb:cookies` en `localStorage` con valor `"all"` o `"necessary"`. Si existe, no se muestra.
  Mismo patrón "oculto hasta leer el almacenamiento" que la barra.
- Contenido fijo en el componente: título corto "Cookies", una frase ("Usamos almacenamiento local
  para recordar tus destinos y el formulario. Sin rastreo de terceros."), enlace "Política de
  cookies" a `/cookies`, botones "Aceptar" (`btn btn-primary btn-sm`) y "Solo necesarias"
  (`btn btn-secondary btn-sm`).
- Estilo (`.cookie`): escritorio, tarjeta fija abajo-izquierda, `max-width: 420px`, fondo
  `var(--paper)`, borde `var(--line)`, sombra suave, `z-index: 90`. Móvil (`max-width: 560px`): ancho
  completo pegado abajo. Mientras está abierta, el componente añade `has-cookie-banner` a `html` y
  `.wa` se oculta en móvil con esa clase, para no solaparse con el botón de WhatsApp.
- `role="dialog"`, `aria-label="Aviso de cookies"`, sin bloquear la página.

## Despliegue

`docker compose up -d --build`. El contenedor ejecuta `prisma migrate deploy` al arrancar.
La web queda unos segundos sin servicio durante el reinicio.

## Verificación

No hay tests automáticos en el proyecto. Se verifica con `npm run lint`, `npm run build` y, tras
desplegar: crear/marcar una promo en el admin, comprobar la barra en la portada, el cierre, el
ancla en /ofertas, que marcar otra desmarca la anterior, y el banner de cookies en portada y asistente.
