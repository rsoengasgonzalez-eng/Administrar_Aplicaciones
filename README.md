# Nexus · Centro de Aplicaciones Recientes

Portal estático con las aplicaciones recientes seleccionadas para publicarse desde GitHub. Se han excluido todas las aplicaciones de Coty y también FrikiMadrid, Impostor Party y Agenda Deportiva.

## Aplicaciones incluidas

1. **Planes con Alma** — organización de planes, calendario, votaciones, inscripciones y WhatsApp.
2. **Mesa Madrid v5** — restaurantes, filtros, mapa, favoritos y solicitudes de reserva.
3. **EscapeMadrid MVP** — buscador y comparador de escape rooms de Madrid.
4. **Madrid Mystery v3** — juego cooperativo de investigación por equipos.

## Publicar el portal en GitHub Pages

1. Extrae el ZIP.
2. Copia todo su contenido a la raíz de un repositorio.
3. En GitHub abre **Settings → Pages**.
4. Selecciona **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
5. Guarda y espera a que GitHub publique el sitio.

También puede publicarse en Cloudflare Pages, Netlify o Azure Static Web Apps sin proceso de compilación.

## Uso local

Sirve la carpeta mediante HTTP para mantener correctamente todas las rutas:

```bash
python3 -m http.server 8080
```

Después abre `http://localhost:8080`.

## Nota sobre el backend

Las aplicaciones estáticas funcionan directamente. Las funciones compartidas de **Madrid Mystery** dependen de su servicio de Cloudflare Workers y de la configuración de producción correspondiente.
