# Planes con Alma

PWA móvil para organizar planes de un grupo de amigos, inspirada en el flujo de `amistadcanasytapas.site`, pero con una experiencia visual y funcional más completa.

## Incluye

- Inicio con próximo plan, buscador, categorías y estadísticas.
- Página pública por plan (`#plan/42`) preparada para compartir.
- Inscripción, cancelación, aforo y promoción automática desde lista de espera.
- Creación, edición y eliminación de planes.
- Comentarios del grupo.
- Calendario mensual y exportación `.ics` individual o mensual.
- Enlaces a Google Maps y texto optimizado para WhatsApp/Web Share.
- Votaciones con cambio de voto y resultados inmediatos.
- Perfil sencillo por alias, sin correo ni contraseña.
- Persistencia local con `localStorage`, funcionamiento offline y PWA instalable.
- Backend opcional para Cloudflare Workers + D1 (`worker/`, `schema.sql`, `wrangler.toml`).
- Diseño responsive y accesible, con cuatro fotografías originales incluidas localmente.

## Ejecutar en local

No necesita instalar dependencias:

```bash
npm run dev
```

Abre `http://localhost:4173`.

## Publicar en Cloudflare Pages

1. Sube esta carpeta a un repositorio de GitHub.
2. En Cloudflare Pages, conecta el repositorio.
3. Configura:
   - **Framework preset:** None
   - **Build command:** vacío
   - **Output directory:** `/`
4. Publica. Los archivos `_headers` y `_redirects` ya están incluidos.

## Activar el backend D1 opcional

La versión entregada funciona de forma autónoma en el navegador para poder probar todos los flujos sin configurar cuentas. Para persistencia compartida entre usuarios:

```bash
npx wrangler d1 create planes-con-alma
# Copia el database_id generado en wrangler.toml
npx wrangler d1 execute planes-con-alma --remote --file=schema.sql
npx wrangler deploy
```

El Worker incluye las rutas base:

- `GET /api/health`
- `GET /api/plans`
- `POST /api/plans`
- `GET /api/plans/:id`

## Personalización rápida

- Colores y tipografías: variables al inicio de `styles.css`.
- Datos iniciales: objeto `seed` en `app.js`.
- Imágenes: `public/images/`.
- Nombre y metadatos sociales: `index.html` y `manifest.webmanifest`.

## Estructura

```text
planes-con-alma/
├── index.html
├── app.js
├── styles.css
├── manifest.webmanifest
├── sw.js
├── icon.svg
├── public/images/
├── worker/index.js
├── schema.sql
├── wrangler.toml
├── _headers
├── _redirects
└── README.md
```
