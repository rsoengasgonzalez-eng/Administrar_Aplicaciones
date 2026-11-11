# EscapeMadrid MVP

Buscador web responsive de escape rooms de Madrid por:

- número de personas;
- temática;
- presupuesto máximo por persona;
- nombre, empresa o zona;
- ordenación por recomendación, precio, capacidad, duración o nombre.

Cada resultado muestra la **web oficial**, la **URL de reserva**, un enlace para **abrir la ubicación en Google Maps** y la **fuente del dato**. También permite comparar hasta tres experiencias y compartir una búsqueda mediante URL.

## Ejecutar en local

No necesita instalar dependencias.

```bash
cd escapemadrid-mvp
python3 -m http.server 8080
```

Abre `http://localhost:8080`.

También puedes ejecutar:

```bash
npm start
```

## Comprobar el catálogo

```bash
npm test
```

La prueba valida IDs únicos, campos obligatorios, rangos de jugadores, modelos de precio, tablas de precio y formato de URLs.

## Estructura

```text
escapemadrid-mvp/
├── index.html          Interfaz y plantilla de tarjetas
├── styles.css          Diseño responsive
├── data.js             Catálogo semilla editable
├── core.js             Lógica de precios, filtros y orden
├── app.js              Filtros, precios, orden, compartir y comparar
├── package.json        Comandos start/test
└── tests/
    ├── test-data.mjs   Validación del catálogo
    └── test-logic.mjs  Pruebas de precios, filtros y orden
```

## Modelo de precio

`data.js` admite cuatro casos:

- `table`: precio total exacto por número de jugadores;
- `perPerson`: importe fijo por participante;
- `range`: rango total publicado; la app interpola un importe **orientativo** para poder comparar;
- `unknown`: precio a consultar; se puede incluir o excluir del resultado.

Los importes variables deben confirmarse siempre en la web oficial antes de reservar.

## Añadir una experiencia

Copia un objeto existente de `data.js` y cambia sus campos. Ejemplo:

```js
{
  id: "empresa-sala",
  name: "Nombre de la sala",
  company: "Empresa",
  area: "Barrio",
  address: "Dirección, Madrid",
  themes: ["Misterio"],
  minPlayers: 2,
  maxPlayers: 6,
  duration: 60,
  pricing: {
    type: "table",
    values: { 2: 60, 3: 75, 4: 88, 5: 100, 6: 108 },
    published: "60 € (2), 75 € (3)..."
  },
  officialUrl: "https://...",
  bookingUrl: "https://...",
  sourceUrl: "https://...",
  note: "Descripción breve."
}
```

Después ejecuta `npm test`.

## Publicar

Al ser una web estática, puede desplegarse en Azure Static Web Apps, GitHub Pages, Netlify, Vercel o cualquier servidor web. En Azure Static Web Apps, configura `/` como carpeta de aplicación y no indiques carpeta de build.

## Próximo paso recomendado

Para un catálogo exhaustivo, sustituye `data.js` por una API con PostgreSQL y un proceso de revisión/actualización. Guarda cada tarifa con fecha de vigencia y conserva la URL de origen; no extraigas automáticamente sitios que lo prohíban en sus condiciones o `robots.txt`.

## Estado de los datos

Catálogo semilla revisado el **8 de noviembre de 2026** a partir de páginas oficiales y del directorio Escape Room Lover. Es una muestra funcional, no un inventario completo de todas las salas de Madrid.
