# Nexus · Portal integrado v5

Portal Cloudflare Worker que reúne cuatro aplicaciones y ejecuta primero el Worker para todas las rutas `/api/*`.

## Aplicaciones y fuentes

- **Planes con Alma:** datos compartidos en un Durable Object con SQLite. La base comienza vacía; no hay planes, perfiles, comentarios ni votaciones precargados.
- **Madrid Mystery:** el portal envía `/api/madrid-mystery/*` al Worker `juego` mediante un service binding, conservando su D1 y el progreso existente.
- **MusicHub:** el portal envía `/api/music-hub/*` al Worker `musichub` mediante un service binding, conservando las canciones, reproducciones, favoritos y playlists de su D1.
- **Mesa Madrid:** restaurantes reales obtenidos de OpenStreetMap/Overpass, sin valoraciones, precios, disponibilidad ni reservas simuladas.
- **EscapeMadrid:** escape rooms publicados en OpenStreetMap/Overpass, sin precios, aforos, duración o temática inventados.

Todas las tarjetas, accesos recientes y enlaces del diálogo de Nexus abren la aplicación en una pestaña nueva y mantienen abierto el portal original.

## Despliegue en Cloudflare desde GitHub

Requisitos:

1. Debe existir el Worker de Madrid Mystery con el nombre de servicio exacto `juego` y su base D1 operativa.
2. Debe existir el Worker de MusicHub con el nombre de servicio exacto `musichub` y su base D1 operativa.
3. El repositorio debe conservar `wrangler.jsonc`, `src/worker.js`, `.assetsignore` y la carpeta `apps`.

Configuración de Workers Builds:

- **Root directory:** `/`
- **Build command:** `npm install`
- **Deploy command:** `npx wrangler deploy`
- **Node:** 22 o posterior

`wrangler.jsonc` crea automáticamente el Durable Object SQLite `PlansStore` en el primer despliegue. No es necesario crear ni introducir un identificador de base para Planes con Alma.

Los bindings `MADRID_MYSTERY` y `MUSIC_HUB` apuntan a los servicios `juego` y `musichub`. Los tres Workers deben pertenecer a la misma cuenta de Cloudflare. Si alguno tiene otro nombre, cambia su valor `service` en `wrangler.jsonc` antes de desplegar.

## Comprobación posterior

Abre estas rutas en el dominio del portal:

- `/api/health`
- `/api/planes/health` con la cabecera `x-client-id`
- `/api/madrid-mystery/health`
- `/api/music-hub/health`
- `/api/mesa/restaurants`
- `/api/escape/rooms`

La primera debe indicar `planesStore: true`, `madridMysteryService: true` y `musicHubService: true`. Madrid Mystery y MusicHub deben informar de base de datos lista. Las dos últimas deben devolver `source: OpenStreetMap / Overpass`.

## Uso local

```bash
npm install
npm run dev
```

El desarrollo local necesita acceso a Cloudflare para Durable Objects y al service binding de Madrid Mystery. Para comprobar solo los archivos estáticos puede usarse `python3 -m http.server 8080`, pero las APIs no estarán disponibles con un servidor estático.
