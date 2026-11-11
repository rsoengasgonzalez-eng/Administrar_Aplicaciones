# Nexus · paquete corregido para Cloudflare Workers

Este repositorio está preparado para subirse directamente a GitHub y desplegarse como **Cloudflare Worker con Static Assets**.

## Estructura correcta

```text
/
├── public/                    # Solo recursos públicos servidos por ASSETS
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── sw.js
│   ├── manifest.webmanifest
│   ├── assets/
│   └── apps/
│       ├── planes-con-alma/
│       ├── mesa-madrid/
│       ├── escape-madrid/
│       ├── madrid-mystery/
│       └── music-hub/
├── src/
│   └── worker.js              # Código privado del Worker; no se publica como asset
├── tests/
│   └── integration.mjs
├── package.json
├── wrangler.jsonc
└── README.md
```

`src/worker.js`, `tests/`, `package.json` y `wrangler.jsonc` permanecen fuera de `public/`.

## Configuración de Static Assets

`wrangler.jsonc` contiene:

```jsonc
"main": "./src/worker.js",
"assets": {
  "directory": "./public",
  "binding": "ASSETS",
  "run_worker_first": ["/api/*"]
}
```

De este modo:

- las rutas `/api/*` se procesan primero en `src/worker.js`;
- el resto de las rutas se sirve desde `public/` mediante `env.ASSETS`;
- `src/worker.js` no queda accesible como archivo estático.

## Service bindings: nombres que debes comprobar

El portal no crea ni inventa identificadores de bases de datos. Madrid Mystery y MusicHub conservan sus propios Workers y sus propias bases D1.

En `wrangler.jsonc` se incluyen estos nombres de servicio:

```jsonc
"services": [
  {
    "binding": "MADRID_MYSTERY",
    "service": "juego"
  },
  {
    "binding": "MUSIC_HUB",
    "service": "musichub"
  }
]
```

Antes de desplegar, comprueba en **Cloudflare → Workers & Pages** el nombre exacto de cada Worker:

1. Si el Worker de Madrid Mystery se llama `juego`, no cambies nada. Si tiene otro nombre, sustituye **únicamente** el valor:
   - `"service": "juego"`
2. Si el Worker de música se llama `musichub`, no cambies nada. Si tiene otro nombre, sustituye **únicamente** el valor:
   - `"service": "musichub"`

No cambies los nombres de binding `MADRID_MYSTERY` y `MUSIC_HUB`, porque `src/worker.js` utiliza exactamente esos nombres.

Los tres Workers deben estar en la misma cuenta de Cloudflare para usar service bindings.

## Durable Object de Planes con Alma

Planes con Alma utiliza el Durable Object `PlansStore` con SQLite:

```jsonc
"durable_objects": {
  "bindings": [
    {
      "name": "PLANES_STORE",
      "class_name": "PlansStore"
    }
  ]
},
"migrations": [
  {
    "tag": "v1",
    "new_sqlite_classes": ["PlansStore"]
  }
]
```

No necesita un `database_id`. Wrangler crea la clase SQLite al desplegar la migración por primera vez.

Si este mismo Worker ya desplegó anteriormente la migración `v1` para `PlansStore`, conserva el historial del Worker y no cambies la etiqueta. Si vas a desplegar con otro nombre de Worker, se creará un almacenamiento nuevo y vacío.

## Rutas integradas

| Ruta pública del portal | Destino |
|---|---|
| `/api/planes/*` | Durable Object SQLite `PLANES_STORE` |
| `/api/mesa/restaurants` | OpenStreetMap mediante Overpass |
| `/api/escape/rooms` | OpenStreetMap mediante Overpass |
| `/api/madrid-mystery/*` | Service binding `MADRID_MYSTERY` |
| `/api/music-hub/*` | Service binding `MUSIC_HUB` |

Las rutas de Madrid Mystery y MusicHub admiten tanto el formato usado por sus frontends, por ejemplo `/api/madrid-mystery/api/game`, como el formato abreviado `/api/madrid-mystery/health`. El proxy las convierte en `/api/game` y `/api/health` respectivamente antes de llamar al Worker de destino.

## Despliegue desde GitHub

1. Descomprime el ZIP.
2. Sube **el contenido extraído** a la raíz del repositorio. La carpeta `public/` debe quedar directamente en la raíz.
3. En Cloudflare abre **Workers & Pages → Create → Import a repository**.
4. Selecciona el repositorio.
5. Configura:
   - **Root directory:** `/`
   - **Build command:** `npm install`
   - **Deploy command:** `npx wrangler deploy`
   - **Node.js:** 20 o posterior; se recomienda 22.
6. Verifica los nombres de servicio `juego` y `musichub` antes del primer despliegue.
7. Despliega.

No configures una carpeta de salida manual en el panel: Wrangler usa `assets.directory = "./public"`.

## Validación local

```bash
npm install
npm run check
npm run dev
```

La instalación puede requerir acceso al registro npm permitido por tu entorno. `npm run check` valida la sintaxis, los proxies, las rutas API y la transformación de los resultados de OpenStreetMap.

## Comprobaciones posteriores al despliegue

Abre en el dominio final:

```text
/api/health
/api/planes/health
/api/mesa/restaurants
/api/escape/rooms
/api/madrid-mystery/health
/api/music-hub/health
```

Resultado esperado de `/api/health`:

```json
{
  "ok": true,
  "portal": "ready",
  "assets": true,
  "planesStore": true,
  "madridMysteryService": true,
  "musicHubService": true,
  "liveData": ["mesa-madrid", "escape-madrid"]
}
```

Si un service binding devuelve `SERVICE_NOT_CONFIGURED`, revisa el nombre del Worker correspondiente en `wrangler.jsonc`. Si el Worker remoto responde pero su base no está lista, corrige la configuración D1 en el repositorio de esa aplicación; Nexus no necesita ni debe contener sus `database_id`.

## Navegación

Todas las tarjetas, botones de apertura, accesos recientes y enlaces del diálogo de Nexus abren las aplicaciones en una pestaña nueva con `noopener noreferrer`, manteniendo el portal abierto en la pestaña original.
