# Mesa Madrid v5 — Cloudflare corregido

Aplicación web estática preparada para Cloudflare Pages. Incluye 100 restaurantes de demostración con coordenadas WGS84 válidas, filtros sincronizados con listado y mapa, mapa vectorial interactivo local, favoritos y solicitudes de reserva guardadas en el navegador.

## Corrección de despliegue en Cloudflare

Esta versión **no incluye `_redirects`**. La regla anterior `/* /index.html 200` hacía que Wrangler detectase un bucle infinito al aplicar el tratamiento nativo de rutas HTML de Cloudflare. La aplicación actual no usa rutas dinámicas del lado cliente y no necesita esa reescritura: `index.html` se sirve directamente desde la raíz mediante el routing estático nativo de Cloudflare.

## Corrección clave

El panel derecho ya no es una ilustración inmóvil. `MadridMap` implementa proyección de latitud/longitud, paneo, zoom, ajuste a resultados, marcadores accesibles y ventanas de detalle. `bootstrap()` espera a que `map.init()` termine antes de ejecutar `applyFilters()`, que genera los marcadores a partir del mismo array filtrado que genera las tarjetas.

El mapa no descarga teselas externas: todo el fondo vectorial está incluido en `index.html`. Por ello no puede producir respuestas 403 de OpenStreetMap y funciona igual en Cloudflare Pages y en un servidor local.

## Probar localmente

No abras el ZIP directamente. Descomprímelo y sirve la carpeta:

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080`.

## Publicar en Cloudflare Pages

1. Sube **el contenido de esta carpeta** a la raíz de un repositorio GitHub.
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git.
3. Rama de producción: `main`.
4. Framework: `None`.
5. Build command: vacío (o `exit 0`).
6. Build output directory: `.`.
7. Deploy.

No añadas un archivo `_redirects`: para esta aplicación basta el routing estático nativo de Cloudflare. Antes de subir el repositorio, confirma que `index.html` está directamente en la raíz.

## Verificación automática incluida

En la consola del navegador, `window.__MESA_QA__` expone:

- `dataCount`
- `validCoordinates`
- `filteredCount`
- `markerCount`
- `mapReady`

Sin filtros, los valores esperados son 100, `true`, 100, 100 y `true`.

## Aviso

Los nombres, valoraciones, características alimentarias y reservas son datos de demostración. Antes de uso real deben verificarse con cada restaurante e integrarse sistemas reales de disponibilidad y reserva.
