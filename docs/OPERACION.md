# Guía de operación · TuristaByBonestar

Cómo se maneja la web en el VPS en el día a día. Todo se ejecuta desde la carpeta del proyecto (en este servidor, `/opt/turistabybonestar/turistabybonestarV2`), donde están `docker-compose.yml` y `.env`.

## Entrar al panel

1. `https://turistabybonestar.com/admin/login`.
2. Usuario: el valor de `ADMIN_EMAIL` en `.env` (puede ser un correo o un nombre de usuario; se guarda en minúsculas). Contraseña: la que se puso en `ADMIN_PASSWORD` la primera vez; después, la que se haya cambiado en **Cuenta**.
3. La sesión dura 12 horas. **Salir** cierra la sesión en ese navegador.

Secciones:

| Sección | Para qué |
| --- | --- |
| Solicitudes | Cada envío del asistente «Cómo viajas». Filtra por estado o busca por nombre/correo/destino. Al abrir una fila: estado, notas internas (se guardan al salir del campo), respuestas, brief `.txt`, correos enviados y «Escribir al cliente» (envía por SMTP con la plantilla de la marca). «Eliminar solicitud» borra los datos personales de verdad (derechos RGPD). |
| Contactos | Mensajes del formulario corto. Marcar atendido, responder (abre el correo) o eliminar. |
| Destinos | Los doce destinos recomendados: textos, coordenadas, «mostrar en la portada», imagen (se sube al servidor), orden con ↑ ↓. No se puede borrar un destino que tenga ofertas. |
| Ofertas | Ofertas de temporada: alta, edición, activa/oculta, orden, imagen. |
| Preguntas | Las dos páginas del asistente. Los cambios se guardan con **Guardar cambios**. |
| Textos | Bloques de la web: marca y contacto (teléfono, WhatsApp, enlace de la comunidad, horario), menú, portada, método, equipo, cierre, mapa, contacto, ofertas y pie. |
| Cuenta | Cambiar la contraseña. |

Cualquier cambio se ve en la web pública al recargar.

### Si se pierde la contraseña

Desde el servidor, con los contenedores en marcha:

```bash
docker compose exec web node -e "
const b=require('bcryptjs');console.log(b.hashSync(process.argv[1],12))" 'NuevaContraseñaSegura'
```

Copia el hash y guárdalo en la base de datos:

```bash
docker compose exec db psql -U tbb -d turistabybonestar -c "update \"AdminUser\" set \"passwordHash\"='<hash>' where email='turistasinlicenciabook@gmail.com';"
```

Para crear un segundo administrador, inserta otra fila en `AdminUser` con su `email`, `name` y `passwordHash`.

## Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| Base de datos | Contenedor `tbb-db` (PostgreSQL 16), volumen Docker `pgdata`. |
| Imágenes subidas desde el panel | `data/uploads/AAAA/MM/*.webp` (montado en el contenedor como `/app/data/uploads`; Nginx lo sirve en `/uploads/`). |
| Copias de seguridad | `backups/db-AAAA-MM-DD.sql.gz` y `backups/uploads-AAAA-MM-DD.tar.gz` (14 días). |
| Configuración y secretos | `.env` (nunca en git). |
| Registro | `docker compose logs -f web` y `docker compose logs -f db`. Cada módulo registra con prefijo: `[solicitudes]`, `[mailer]`, `[admin/media]`, `[health]`… |

## Copias de seguridad

`deploy/backup.sh` hace un `pg_dump` del contenedor `db` y un `tar` de `data/uploads`, y borra lo que tenga más de 14 días (`BACKUP_KEEP_DAYS` en `.env` para cambiarlo). Programado en el cron del host:

```
15 3 * * * cd /opt/turistabybonestar/turistabybonestarV2 && ./deploy/backup.sh >> backups/backup.log 2>&1
```

Comprueba de vez en cuando que `backups/` tiene ficheros recientes y copia la carpeta fuera del servidor (rsync, Backblaze, Drive…): una copia en el mismo disco no protege contra la pérdida del VPS.

### Restaurar

Base de datos (sobrescribe la actual; detén primero la web para que nadie escriba mientras tanto):

```bash
docker compose stop web
gunzip -c backups/db-2026-10-07.sql.gz | docker compose exec -T db psql -U tbb -d turistabybonestar
docker compose start web
```

Imágenes:

```bash
tar -xzf backups/uploads-2026-10-07.tar.gz -C .
```

Servidor nuevo desde cero: clona el repositorio, copia `.env` y la carpeta `backups/`, `docker compose up -d --build` (crea la base de datos vacía y migrada), y después restaura la base de datos y las imágenes como arriba. Si no hay copia de la base de datos, el seed deja la web con los destinos, ofertas y textos iniciales y el usuario de `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

## Actualizar la web

```bash
cd /opt/turistabybonestar/turistabybonestarV2
git pull
docker compose up -d --build
docker compose logs -f web      # hasta ver "Ready"
curl -s localhost:3000/api/health   # {"ok":true,"db":"ok"}
```

El contenedor aplica las migraciones pendientes (`prisma migrate deploy`) y el seed idempotente en cada arranque. Si una migración falla, la web no arranca: mira el registro y restaura la copia de la base de datos si hace falta.

## Comprobaciones rápidas

- `curl -s localhost:3000/api/health` → `{"ok":true,"db":"ok"}`.
- `docker compose ps` → `tbb-db` *healthy* y `tbb-web` *healthy*.
- Envía una solicitud de prueba desde la web y comprueba que aparece en **Solicitudes** y que llegan los dos correos (cliente y agencia). Si no llegan, en la ficha de la solicitud el apartado «Correos enviados» indica *Error* o *Sin SMTP*; revisa `SMTP_*` en `.env` y `docker compose logs web | grep mailer`.
- Tras un reinicio del servidor los contenedores vuelven solos (`restart: unless-stopped`).

## Mantenimiento opcional

- **Anonimizar solicitudes antiguas**: las cerradas con más de 24 meses pueden anonimizarse (se conservan las respuestas, se borran nombre, correo y teléfono). La función `anonymiseClosed()` está en `src/lib/repo/solicitudes.ts`; para hacerlo a mano:

  ```bash
  docker compose exec db psql -U tbb -d turistabybonestar -c "
  update \"Solicitud\" set name='Anonimizado', email='', phone='',
    data = jsonb_set(data, '{contacto}', '{\"nombre\":\"Anonimizado\",\"email\":\"\",\"telefono\":\"\",\"canal\":\"\",\"privacidad\":true}')
  where status='cerrada' and \"createdAt\" < now() - interval '24 months' and email <> '';"
  ```

- **Imágenes huérfanas**: las fotos que ya no usa ningún destino u oferta siguen en `data/uploads`. Se pueden borrar desde la tabla `MediaAsset` y el disco cuando convenga.
- **Variables de entorno**: tras cambiar `.env`, `docker compose up -d` recrea el contenedor con los nuevos valores.
