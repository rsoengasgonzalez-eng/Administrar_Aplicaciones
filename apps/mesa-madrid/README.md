# Mesa Madrid · integrada

La aplicación consulta `/api/mesa/restaurants`. El Worker obtiene restaurantes publicados en OpenStreetMap mediante Overpass API y normaliza nombre, coordenadas, dirección, cocina, horario, teléfono, web y opciones dietéticas cuando existen.

No se incluyen restaurantes, valoraciones, precios, disponibilidad ni reservas de demostración. Los favoritos son la única preferencia local. Los enlaces de acción conducen a la web publicada, teléfono o ubicación del establecimiento.
