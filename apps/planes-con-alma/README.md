# Planes con Alma · integrada

Esta versión no incluye planes, asistentes, comentarios ni votaciones precargados. La interfaz consume `/api/planes/*`; el mismo Worker del portal guarda los datos compartidos en un Durable Object con almacenamiento SQLite.

- El navegador conserva únicamente un identificador privado para recuperar el perfil.
- Los planes y toda la actividad compartida se guardan en el backend.
- La fecha inicial del calendario y la fecha mínima de creación se calculan en tiempo real.
- Las imágenes incluidas son únicamente portadas seleccionables; no representan planes ni datos.
