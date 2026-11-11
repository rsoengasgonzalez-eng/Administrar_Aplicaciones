# Nexus · versión definitiva para Cloudflare Workers

Este repositorio está preparado para sustituir el contenido del repositorio de GitHub y desplegarse como **Cloudflare Worker con Static Assets**.

## Estructura

```text
/
├── public/                    # Únicos recursos servidos por ASSETS
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
│   └── worker.js              # No se publica como recurso estático
├── tests/
├── package.json
├── wrangler.jsonc
└── README.md
```

## Bindings confirmados

Nexus mantiene los bindings de Static Assets y Durable Objects que ya funcionaron:

- `ASSETS`: sirve `./public`.
- `PLANES_STORE`: namespace del Durable Object SQLite `PlansStore`.

Los nombres reales de los Workers enlazados son:

| Binding disponible en Nexus | Worker de destino confirmado |
|---|---|
| `MADRID_MYSTERY` | `juego` |
| `MUSIC_HUB` | `musica` |
| `ESCAPE_ROOMS` | `scaperooms` |

Los bindings están declarados en `wrangler.jsonc`. Los Workers de destino deben existir previamente en la **misma cuenta de Cloudflare**. Un service binding enlaza Workers; no copia, reemplaza ni vacía sus bases de datos.

## Rutas integradas

| Ruta de Nexus | Destino o fuente |
|---|---|
| `/api/planes/*` | Durable Object `PLANES_STORE`, instancia con nombre `global` |
| `/api/mesa/restaurants` | OpenStreetMap mediante Overpass |
| `/api/escape/rooms` | Worker `scaperooms`; OpenStreetMap como respaldo |
| `/api/madrid-mystery/*` | Worker `juego` |
| `/api/music-hub/*` | Worker `musica` |

### Escape Rooms

Nexus intenta obtener el catálogo real de `scaperooms` mediante estas rutas, por orden:

```text
/api/rooms
/api/escape/rooms
/api/escape-rooms
/api/escapes
/api/bootstrap
/data.js
```

Acepta respuestas con arrays `items`, `rooms`, `escapeRooms`, `escapes`, `results`, `events` o `data`. También puede leer el catálogo `window.ESCAPE_ROOMS` de la aplicación estática original sin ejecutar JavaScript remoto. Si el Worker no ofrece ninguno de estos formatos, Nexus utiliza la consulta real de OpenStreetMap como respaldo.

## Despliegue desde GitHub

1. Extrae el ZIP.
2. Sustituye el contenido del repositorio por **el contenido extraído**. `public/`, `src/`, `tests/`, `package.json` y `wrangler.jsonc` deben quedar directamente en la raíz.
3. En Cloudflare abre **Workers & Pages → Create → Import a repository**.
4. Usa:
   - **Root directory:** `/`
   - **Build command:** `npm install`
   - **Deploy command:** `npx wrangler deploy`
   - **Node.js:** 20 o posterior; se recomienda 22.
5. No configures una carpeta de salida en el panel. Wrangler ya usa `assets.directory = "./public"`.
6. Despliega primero los Workers de destino `juego`, `musica` y `scaperooms`; después despliega Nexus.

## Comprobaciones posteriores

```text
/api/health
/api/planes/health
/api/mesa/restaurants
/api/escape/rooms
/api/madrid-mystery/health
/api/music-hub/health
```

`/api/health` debe indicar:

```json
{
  "ok": true,
  "portal": "ready",
  "assets": true,
  "planesStore": true,
  "madridMysteryService": true,
  "musicHubService": true,
  "escapeRoomsService": true,
  "liveData": ["mesa-madrid", "escape-madrid"]
}
```

## Cargar y reutilizar datos existentes de Cloudflare

### 1. Diferencia fundamental: D1 frente a Durable Objects SQLite

**D1** es una base SQLite gestionada como recurso independiente. Un Worker la recibe mediante un binding incluido en su propia configuración `d1_databases`. Se administra desde **Storage & databases → D1** o mediante `wrangler d1`.

**Durable Objects SQLite** es almacenamiento privado de cada instancia de un Durable Object. No es una base D1, no tiene `database_id` de D1 y no se administra con `wrangler d1 execute`. Cada objeto —por ejemplo el objeto nombrado `global`— tiene su propia base SQLite.

No importes datos de una tecnología en la otra sin una migración explícita.

### 2. Cómo identificar los recursos reales de cada Worker

Para cada Worker existente (`juego`, `musica`, `scaperooms` y cualquier otro):

1. Abre **Cloudflare → Workers & Pages → nombre del Worker → Settings → Bindings**.
2. Anota por separado:
   - nombre del binding visible para el código, por ejemplo `DB`;
   - tipo del recurso: D1, Durable Object, R2, KV o service binding;
   - nombre real del recurso enlazado.
3. Abre el `wrangler.jsonc` del repositorio de ese Worker y comprueba que coincide con el panel.
4. Para D1, ejecuta en una sesión autenticada de Wrangler:

```bash
npx wrangler d1 list
npx wrangler d1 info <NOMBRE_REAL_DE_LA_BASE>
```

Usa el nombre devuelto por `d1 list`. No copies identificadores de capturas antiguas ni inventes un `database_id`.

Información conocida de los paquetes originales, que debe verificarse contra el despliegue real:

- El código recuperado de `juego` utilizaba un binding D1 llamado `DB` y hacía referencia a una base denominada `madrid-mystery-db`.
- El código recuperado de `musica` utilizaba un binding D1 llamado `DB` y hacía referencia a una base denominada `music-hub-db`.
- El binding o tipo de almacenamiento interno de `scaperooms` no se presupone en Nexus. Debes leerlo en **Settings → Bindings** del Worker `scaperooms`.
- Mesa Madrid obtiene restaurantes de OpenStreetMap y no necesita una base propia en Nexus.
- EscapeMadrid consume `scaperooms` y utiliza OpenStreetMap como respaldo; Nexus no crea una D1 de Escape Rooms.

### 3. Enlazar Workers sin perder los datos existentes

Los service bindings de Nexus solo apuntan a los Workers desplegados:

```jsonc
"services": [
  { "binding": "MADRID_MYSTERY", "service": "juego" },
  { "binding": "MUSIC_HUB", "service": "musica" },
  { "binding": "ESCAPE_ROOMS", "service": "scaperooms" }
]
```

Para conservar los datos:

- no vuelvas a crear las D1 de `juego` o `musica`;
- no sustituyas en esos repositorios su binding D1 por una base nueva;
- no ejecutes `wrangler d1 create` salvo que realmente quieras una base vacía;
- no cambies el nombre de los Workers de destino sin actualizar después `service` en Nexus;
- despliega cada aplicación desde su repositorio y Nexus desde el suyo: son Workers independientes.

### 4. Consultar tablas y registros de una D1

Primero identifica el nombre real con `d1 list`. Después:

```bash
npx wrangler d1 info <NOMBRE_REAL_DE_LA_BASE>

npx wrangler d1 execute <NOMBRE_REAL_DE_LA_BASE> --remote \
  --command "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;"
```

Para revisar datos, sustituye los nombres por tablas que existan realmente:

```bash
npx wrangler d1 execute <NOMBRE_REAL_DE_LA_BASE> --remote \
  --command "SELECT COUNT(*) AS total FROM <TABLA_REAL>;"

npx wrangler d1 execute <NOMBRE_REAL_DE_LA_BASE> --remote \
  --command "SELECT * FROM <TABLA_REAL> LIMIT 20;"
```

Tablas esperadas según el código recuperado —verifícalas antes de consultar—:

- `juego`: `players`, `teams`, `team_members`, `case_runs`, `team_case_state`, `team_clue_unlocks`, `team_mission_progress`, `mission_attempts`, `team_accusations`, `team_case_results`, `score_events`.
- `musica`: `users`, `genres`, `songs`, `plays`, `likes`, `playlists`, `playlist_songs`.
- `scaperooms`: no se presupone ningún esquema; enumera primero `sqlite_schema` si el Worker tiene D1.

También puedes consultar las tablas desde **Cloudflare → Storage & databases → D1 → base real → Console**.

### 5. Exportar antes de modificar o importar D1

Haz una copia completa antes de ejecutar migraciones o importaciones:

```bash
npx wrangler d1 export <NOMBRE_REAL_DE_LA_BASE> --remote \
  --output=./backup-completo.sql
```

Solo esquema:

```bash
npx wrangler d1 export <NOMBRE_REAL_DE_LA_BASE> --remote \
  --output=./schema.sql --no-data
```

Solo datos:

```bash
npx wrangler d1 export <NOMBRE_REAL_DE_LA_BASE> --remote \
  --output=./data.sql --no-schema
```

### 6. Importar SQL en D1 cuando proceda

Utiliza un archivo SQL compatible con SQLite y revisado. Prueba primero en una base de ensayo si el contenido es importante.

```bash
npx wrangler d1 execute <NOMBRE_REAL_DE_LA_BASE> --remote \
  --file=./datos-revisados.sql
```

Después valida tablas y recuentos. No vuelvas a aplicar a ciegas archivos que contengan `INSERT` sin estrategia de conflicto, porque pueden duplicar registros. Si partes de un archivo `.sqlite3`, conviértelo primero a SQL; D1 no importa directamente el binario SQLite.

### 7. Planes con Alma: acceder al Durable Object `global`

Planes con Alma **no usa D1**. Nexus resuelve siempre la misma instancia con:

```js
const id = env.PLANES_STORE.idFromName("global");
const stub = env.PLANES_STORE.get(id);
```

Para abrir sus datos:

1. Abre **Cloudflare Dashboard → Durable Objects**.
2. Selecciona el namespace asociado a la clase `PlansStore` del Worker Nexus.
3. Pulsa **Data Studio**.
4. Cuando solicite el identificador, introduce el nombre único:

```text
global
```

5. Consulta las tablas:

```sql
SELECT name
FROM sqlite_schema
WHERE type = 'table'
ORDER BY name;
```

6. Revisa recuentos y datos:

```sql
SELECT COUNT(*) AS total FROM plans;
SELECT * FROM plans ORDER BY starts_at LIMIT 50;
SELECT * FROM users LIMIT 50;
SELECT * FROM attendees LIMIT 100;
SELECT * FROM comments ORDER BY created_at DESC LIMIT 100;
SELECT * FROM polls ORDER BY created_at DESC;
SELECT * FROM poll_options;
SELECT * FROM poll_votes;
```

Data Studio actúa sobre el objeto remoto de producción. Las escrituras son reales y deben hacerse con copia y revisión previa.

### 8. Importar datos en `PlansStore`

No uses `wrangler d1 execute`: `PLANES_STORE` no es D1. Para pocos registros, utiliza **Durable Objects Data Studio** sobre el objeto `global` y ejecuta SQL compatible con las tablas reales.

Orden recomendado por dependencias:

1. `users`
2. `plans`
3. `attendees`
4. `comments`
5. `polls`
6. `poll_options`
7. `poll_votes`

Antes de insertar:

```sql
SELECT * FROM users;
SELECT * FROM plans;
```

Usa identificadores que no colisionen, conserva `owner_id`/`user_id` válidos y prueba primero una única fila. Para cargas grandes, crea una ruta administrativa temporal autenticada o un script de migración específico; no conviertas el Durable Object en D1 ni crees otro objeto con un nombre distinto de `global`, porque Nexus no lo leerá.

## Validación local

```bash
npm install
npm run check
npm run dev
```

Para probar localmente los tres service bindings, ejecuta también los Workers secundarios o usa Wrangler con varias configuraciones. En producción, los Workers de destino deben desplegarse antes que Nexus.

## Navegación

Todas las tarjetas, botones de apertura, accesos recientes y enlaces del diálogo de Nexus abren la aplicación en una pestaña nueva con `noopener noreferrer`, manteniendo Nexus abierto en la pestaña original.
