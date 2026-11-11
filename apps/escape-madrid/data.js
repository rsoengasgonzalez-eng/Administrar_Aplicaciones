/* Catálogo semilla. Revisado el 08/11/2026. Los precios variables deben confirmarse en la URL oficial. */
window.ESCAPE_ROOMS = [
  {
    id: "rombo-quijote", name: "El misterio de Don Quijote", company: "The Rombo Code", area: "Chamberí / Argüelles",
    address: "Calle de Meléndez Valdés, 18, Madrid", themes: ["Misterio"], minPlayers: 2, maxPlayers: 14, duration: 60,
    pricing: { type: "range", minTotal: 75, maxTotal: 350, published: "75–350 € por grupo; desde 21,50 €/persona en la web oficial" },
    officialUrl: "https://therombocode.es/madrid/", bookingUrl: "https://therombocode.es/madrid/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Juego duplicado para grupos grandes y modo competición."
  },
  {
    id: "rombo-espejo", name: "Tras el espejo", company: "The Rombo Code", area: "Chamberí / Argüelles",
    address: "Calle de Meléndez Valdés, 18, Madrid", themes: ["Misterio", "Tensión"], minPlayers: 3, maxPlayers: 12, duration: 60,
    pricing: { type: "range", minTotal: 81, maxTotal: 228, published: "81–228 € por grupo; desde 21,50 €/persona en la web oficial" },
    officialUrl: "https://therombocode.es/madrid/", bookingUrl: "https://therombocode.es/madrid/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Experiencia inquietante, disponible en dos salas simultáneas."
  },
  {
    id: "rombo-camino", name: "El secreto del camino", company: "The Rombo Code", area: "Chamberí / Argüelles",
    address: "Calle de Meléndez Valdés, 18, Madrid", themes: ["Aventura", "Histórico"], minPlayers: 3, maxPlayers: 12, duration: 60,
    pricing: { type: "range", minTotal: 81, maxTotal: 228, published: "81–228 € por grupo; desde 21,50 €/persona en la web oficial" },
    officialUrl: "https://therombocode.es/madrid/", bookingUrl: "https://therombocode.es/madrid/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Aventura histórica y de acción, con modalidad para grupos grandes."
  },
  {
    id: "hermetico-chocolate", name: "Fábrica de chocolate", company: "Hermético", area: "Chamberí",
    address: "Calle de Santa Engracia, 15, Madrid", themes: ["Fantasía", "Familiar"], minPlayers: 2, maxPlayers: 5, duration: 60,
    pricing: { type: "range", minTotal: 75, maxTotal: 95, published: "75–95 € por grupo" },
    officialUrl: "https://hermetico.es/", bookingUrl: "https://hermetico.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid/jugadores/2",
    note: "Opción de fantasía para equipos pequeños."
  },
  {
    id: "hermetico-inquisicion", name: "Inquisición", company: "Hermético", area: "Chamberí",
    address: "Calle de Santa Engracia, 15, Madrid", themes: ["Misterio", "Histórico"], minPlayers: 2, maxPlayers: 5, duration: 60,
    pricing: { type: "range", minTotal: 75, maxTotal: 95, published: "75–95 € por grupo" },
    officialUrl: "https://hermetico.es/", bookingUrl: "https://hermetico.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid/jugadores/2",
    note: "Misterio histórico de dificultad media."
  },
  {
    id: "hermetico-vampiro", name: "La cripta del vampiro", company: "Hermético", area: "Chamberí",
    address: "Calle de Santa Engracia, 15, Madrid", themes: ["Aventura", "Terror"], minPlayers: 2, maxPlayers: 5, duration: 60,
    pricing: { type: "range", minTotal: 75, maxTotal: 95, published: "75–95 € por grupo" },
    officialUrl: "https://hermetico.es/", bookingUrl: "https://hermetico.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid/jugadores/2",
    note: "Aventura de ambientación oscura."
  },
  {
    id: "hermetico-mafia", name: "Asalto a la Mafia", company: "Hermético", area: "Chamberí",
    address: "Calle de Santa Engracia, 15, Madrid", themes: ["Criminal", "Aventura"], minPlayers: 2, maxPlayers: 5, duration: 60,
    pricing: { type: "range", minTotal: 75, maxTotal: 95, published: "75–95 € por grupo" },
    officialUrl: "https://hermetico.es/", bookingUrl: "https://hermetico.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid/jugadores/2",
    note: "Experiencia de crimen y acción para grupos reducidos."
  },
  {
    id: "hermetico-canibal", name: "El caníbal", company: "Hermético", area: "Chamberí",
    address: "Calle de Santa Engracia, 15, Madrid", themes: ["Terror", "Tensión"], minPlayers: 2, maxPlayers: 5, duration: 60,
    pricing: { type: "range", minTotal: 80, maxTotal: 115, published: "80–115 € por grupo" },
    officialUrl: "https://hermetico.es/", bookingUrl: "https://hermetico.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid/jugadores/2",
    note: "Sala de miedo con acting; consulta restricciones en la web."
  },
  {
    id: "incognito-monster", name: "The Monster", company: "Incognito Escape", area: "Príncipe Pío",
    address: "Calle de Linneo, 4, Madrid", themes: ["Misterio", "Ciencia ficción"], minPlayers: 2, maxPlayers: 8, duration: 60,
    pricing: { type: "range", minTotal: 100, maxTotal: 200, published: "100–200 € por grupo" },
    officialUrl: "https://incognitoescape.es/", bookingUrl: "https://incognitoescape.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Experiencia ambientada en los laboratorios de Frankenstein."
  },
  {
    id: "incognito-steampunk", name: "Operación Steampunk", company: "Incognito Escape", area: "Príncipe Pío",
    address: "Calle de Linneo, 4, Madrid", themes: ["Aventura", "Steampunk"], minPlayers: 2, maxPlayers: 6, duration: 60,
    pricing: { type: "range", minTotal: 80, maxTotal: 130, published: "80–130 € por grupo" },
    officialUrl: "https://incognitoescape.es/", bookingUrl: "https://incognitoescape.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Aventura tecnológica de estética steampunk."
  },
  {
    id: "incognito-vr", name: "Escape Room VR Ubisoft", company: "Incognito Escape", area: "Príncipe Pío",
    address: "Calle de Linneo, 4, Madrid", themes: ["Realidad virtual", "Aventura"], minPlayers: 2, maxPlayers: 4, duration: 60,
    pricing: { type: "range", minTotal: 80, maxTotal: 100, published: "80–100 € por grupo" },
    officialUrl: "https://incognitoescape.es/", bookingUrl: "https://incognitoescape.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Experiencia de realidad virtual para grupos pequeños."
  },
  {
    id: "incognito-tapeo", name: "TAPEO Escape Box", company: "Incognito Escape", area: "Príncipe Pío / portátil",
    address: "Calle de Linneo, 4, Madrid", themes: ["Juego portátil", "Aventura"], minPlayers: 3, maxPlayers: 6, duration: 60,
    pricing: { type: "range", minTotal: 90, maxTotal: 130, published: "90–130 € por grupo" },
    officialUrl: "https://incognitoescape.es/", bookingUrl: "https://incognitoescape.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Formato de escape box portátil."
  },
  {
    id: "incognito-atraco", name: "El Atraco", company: "Incognito Escape", area: "Madrid / portátil",
    address: "Calle de Linneo, 4, Madrid", themes: ["Hall game", "Criminal"], minPlayers: 10, maxPlayers: 100, duration: 60,
    pricing: { type: "perPerson", amount: 20, published: "20 €/persona" },
    officialUrl: "https://incognitoescape.es/", bookingUrl: "https://incognitoescape.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Hall escape competitivo para grupos grandes; puede trasladarse a eventos."
  },
  {
    id: "fox-zodiaco", name: "Asesino del Zodiaco", company: "Fox in a Box", area: "Palos de la Frontera / Atocha",
    address: "Calle de Áncora, 12, Madrid", themes: ["Terror", "Misterio"], minPlayers: 2, maxPlayers: 14, duration: 60,
    pricing: { type: "range", minTotal: 90, maxTotal: 350, published: "90–350 € por grupo" },
    officialUrl: "https://foxinaboxmadrid.com/", bookingUrl: "https://foxinaboxmadrid.com/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Dos salas disponibles para jugar en paralelo."
  },
  {
    id: "fox-prision", name: "Cadena perpetua", company: "Fox in a Box", area: "Palos de la Frontera / Atocha",
    address: "Calle de Áncora, 12, Madrid", themes: ["Criminal", "Aventura"], minPlayers: 2, maxPlayers: 14, duration: 60,
    pricing: { type: "range", minTotal: 90, maxTotal: 350, published: "90–350 € por grupo" },
    officialUrl: "https://foxinaboxmadrid.com/", bookingUrl: "https://foxinaboxmadrid.com/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Escape de prisión con dos salas para grupos grandes."
  },
  {
    id: "fox-saloon", name: "El pollo dorado saloon", company: "Fox in a Box", area: "Palos de la Frontera / Atocha",
    address: "Calle de Áncora, 12, Madrid", themes: ["Aventura", "Oeste"], minPlayers: 2, maxPlayers: 7, duration: 60,
    pricing: { type: "range", minTotal: 90, maxTotal: 175, published: "90–175 € por grupo" },
    officialUrl: "https://foxinaboxmadrid.com/", bookingUrl: "https://foxinaboxmadrid.com/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Aventura ambientada en el Lejano Oeste."
  },
  {
    id: "fox-mastermind", name: "Mastermind", company: "Fox in a Box", area: "Palos de la Frontera / Atocha",
    address: "Calle de Áncora, 12, Madrid", themes: ["Criminal", "Misterio"], minPlayers: 2, maxPlayers: 7, duration: 60,
    pricing: { type: "range", minTotal: 80, maxTotal: 180, published: "80–180 € por grupo" },
    officialUrl: "https://foxinaboxmadrid.com/", bookingUrl: "https://foxinaboxmadrid.com/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Misión criminal basada en lógica y cooperación."
  },
  {
    id: "college-casino", name: "Robo al Casino", company: "Escape College", area: "Gran Vía / Callao",
    address: "Calle de San Bernardo, 5, Madrid", themes: ["Criminal", "Aventura"], minPlayers: 2, maxPlayers: 6, duration: 60,
    pricing: { type: "table", values: {2:55,3:65,4:75,5:85,6:95}, published: "55 € (2), 65 € (3), 75 € (4), 85 € (5), 95 € (6)" },
    officialUrl: "https://escapecollegemadrid.com/", bookingUrl: "https://escapecollegemadrid.com/reservas/", sourceUrl: "https://escapecollegemadrid.com/reservas/",
    note: "Sala estándar de 60 minutos."
  },
  {
    id: "college-jurassic", name: "Jurassic Lab", company: "Escape College", area: "Gran Vía / Callao",
    address: "Calle de San Bernardo, 5, Madrid", themes: ["Aventura", "Ciencia ficción"], minPlayers: 4, maxPlayers: 8, duration: 75,
    pricing: { type: "table", values: {4:85,5:95,6:105,7:115,8:125}, published: "85 € (4), 95 € (5), 105 € (6), 115 € (7), 125 € (8)" },
    officialUrl: "https://escapecollegemadrid.com/", bookingUrl: "https://escapecollegemadrid.com/reservas/", sourceUrl: "https://escapecollegemadrid.com/reservas/",
    note: "Experiencia jurásica de 75 minutos."
  },
  {
    id: "college-tesla", name: "Edison vs. Tesla", company: "Escape College", area: "Gran Vía / Callao",
    address: "Calle de San Bernardo, 5, Madrid", themes: ["Histórico", "Ciencia ficción"], minPlayers: 2, maxPlayers: 6, duration: 60,
    pricing: { type: "table", values: {2:55,3:65,4:75,5:85,6:95}, published: "55 € (2), 65 € (3), 75 € (4), 85 € (5), 95 € (6)" },
    officialUrl: "https://escapecollegemadrid.com/", bookingUrl: "https://escapecollegemadrid.com/reservas/", sourceUrl: "https://escapecollegemadrid.com/reservas/",
    note: "Nueva York, 1888: una misión sobre la guerra de las corrientes."
  },
  {
    id: "college-kentley", name: "¿Quién mató a David Kentley?", company: "Escape College", area: "Gran Vía / Callao",
    address: "Calle de San Bernardo, 5, Madrid", themes: ["Misterio", "Criminal"], minPlayers: 2, maxPlayers: 6, duration: 60,
    pricing: { type: "table", values: {2:55,3:65,4:75,5:85,6:95}, published: "55 € (2), 65 € (3), 75 € (4), 85 € (5), 95 € (6)" },
    officialUrl: "https://escapecollegemadrid.com/", bookingUrl: "https://escapecollegemadrid.com/reservas/", sourceUrl: "https://escapecollegemadrid.com/reservas/",
    note: "Investigación de un asesinato sin resolver."
  },
  {
    id: "college-london", name: "Fear in London: The Elixir", company: "Escape College", area: "Gran Vía / Callao",
    address: "Calle de San Bernardo, 5, Madrid", themes: ["Terror", "Misterio"], minPlayers: 2, maxPlayers: 6, duration: 60,
    pricing: { type: "table", values: {2:55,3:65,4:75,5:85,6:95}, published: "55 € (2), 65 € (3), 75 € (4), 85 € (5), 95 € (6)" },
    officialUrl: "https://escapecollegemadrid.com/", bookingUrl: "https://escapecollegemadrid.com/reservas/", sourceUrl: "https://escapecollegemadrid.com/reservas/",
    note: "Terror en el Londres de 1911."
  },
  {
    id: "college-white", name: "The White Room", company: "Escape College", area: "Gran Vía / Callao",
    address: "Calle de San Bernardo, 5, Madrid", themes: ["Clásico", "Misterio"], minPlayers: 2, maxPlayers: 6, duration: 60,
    pricing: { type: "table", values: {2:55,3:65,4:75,5:85,6:95}, published: "55 € (2), 65 € (3), 75 € (4), 85 € (5), 95 € (6)" },
    officialUrl: "https://escapecollegemadrid.com/", bookingUrl: "https://escapecollegemadrid.com/reservas/", sourceUrl: "https://escapecollegemadrid.com/reservas/",
    note: "Diseño inspirado en el concepto clásico de habitación de escape."
  },
  {
    id: "college-vaticano", name: "Vaticano", company: "Escape College", area: "Gran Vía / Callao",
    address: "Calle de San Bernardo, 5, Madrid", themes: ["Misterio", "Histórico"], minPlayers: 2, maxPlayers: 6, duration: 60,
    pricing: { type: "table", values: {2:55,3:65,4:75,5:85,6:95}, published: "55 € (2), 65 € (3), 75 € (4), 85 € (5), 95 € (6)" },
    officialUrl: "https://escapecollegemadrid.com/", bookingUrl: "https://escapecollegemadrid.com/reservas/", sourceUrl: "https://escapecollegemadrid.com/reservas/",
    note: "Misterio histórico centrado en la búsqueda del Santo Grial."
  },
  {
    id: "box-haunted", name: "The Haunted Box", company: "The Box", area: "Alonso Martínez",
    address: "Alonso Martínez, Madrid", themes: ["Terror", "Paranormal"], minPlayers: 2, maxPlayers: 6, duration: 60,
    pricing: { type: "range", minTotal: 60, maxTotal: 120, published: "60–120 € por grupo" },
    officialUrl: "https://escapethebox.es/", bookingUrl: "https://escapethebox.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Misterio paranormal sin actores."
  },
  {
    id: "box-temple", name: "The Temple Box", company: "The Box", area: "Alonso Martínez",
    address: "Alonso Martínez, Madrid", themes: ["Aventura", "Familiar"], minPlayers: 2, maxPlayers: 6, duration: 60,
    pricing: { type: "range", minTotal: 60, maxTotal: 120, published: "60–120 € por grupo" },
    officialUrl: "https://escapethebox.es/", bookingUrl: "https://escapethebox.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Aventura de exploración en busca de un tesoro perdido."
  },
  {
    id: "box-hex", name: "El juego de Hex", company: "The Box", area: "Alonso Martínez",
    address: "Alonso Martínez, Madrid", themes: ["Ciencia ficción", "Arcade"], minPlayers: 2, maxPlayers: 7, duration: 60,
    pricing: { type: "range", minTotal: 60, maxTotal: 140, published: "60–140 € por grupo" },
    officialUrl: "https://escapethebox.es/", bookingUrl: "https://escapethebox.es/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid",
    note: "Aventura retro en un antiguo arcade."
  },
  {
    id: "exit-museo", name: "Atrapado en el Museo", company: "EXIT/SALIDA", area: "Malasaña / Tribunal",
    address: "Calle de Jesús del Valle, 32, Madrid", themes: ["Aventura", "Familiar"], minPlayers: 2, maxPlayers: 8, duration: 60,
    pricing: { type: "range", minTotal: 55, maxTotal: 115, published: "55–115 € por grupo" },
    officialUrl: "https://lasalida.net/", bookingUrl: "https://lasalida.net/product/reserva/", sourceUrl: "https://lasalida.net/",
    note: "Juego de lógica para escapar de una exposición del museo."
  },
  {
    id: "enigma-virus", name: "El Virus", company: "Enigma Madrid", area: "Tetuán",
    address: "Calle de Nuestra Señora del Carmen, 7, Madrid", themes: ["Apocalíptico", "Ciencia ficción"], minPlayers: 2, maxPlayers: 12, duration: 60,
    pricing: { type: "range", minTotal: 64, maxTotal: 236, published: "64–236 € por grupo" },
    officialUrl: "https://www.juegoenigmamadrid.es/", bookingUrl: "https://www.juegoenigmamadrid.es/", sourceUrl: "https://www.escaperoomlover.com/es/juego/juego-enigma-0-madrid-el-virus",
    note: "Dos salas idénticas permiten modo competición para hasta 12 personas."
  },
  {
    id: "coco-fabrica", name: "La Fábrica", company: "Coco Room", area: "Embajadores / Arganzuela",
    address: "Calle de Moratines, 18, Madrid", themes: ["Tecnológico", "Aventura"], minPlayers: 2, maxPlayers: 12, duration: 60,
    pricing: { type: "table", values: {2:75,3:81,4:96,5:110,6:132,7:154,8:176,9:198,10:220,11:242,12:264}, published: "75 € (2), 81 € (3), 96 € (4); 22 €/persona de 5 a 12" },
    officialUrl: "https://cocoroom.es/la-fabrica/", bookingUrl: "https://cocoroom.es/la-fabrica/", sourceUrl: "https://cocoroom.es/la-fabrica/",
    note: "De 7 a 12 jugadores se juega por equipos dentro de la misma historia."
  },
  {
    id: "materia-forajidos", name: "Forajidos", company: "Materia Gris", area: "Carabanchel",
    address: "Calle de la Parra, 41, Madrid", themes: ["Aventura", "Oeste", "Familiar"], minPlayers: 2, maxPlayers: 7, duration: 60,
    pricing: { type: "range", minTotal: 65, maxTotal: 140, published: "65–140 € por grupo" },
    officialUrl: "https://escapemateriagris.com/", bookingUrl: "https://escapemateriagris.com/", sourceUrl: "https://www.escaperoomlover.com/es/ciudad/madrid/jugadores/2",
    note: "Aventura del Oeste para adultos y niños."
  },
  {
    id: "madrid-terror-truecrime", name: "#TRUECRIME", company: "Madrid Terror", area: "Arganzuela",
    address: "Paseo de la Esperanza, 53, Madrid", themes: ["Terror", "Inmersivo"], minPlayers: 2, maxPlayers: 15, duration: 75,
    pricing: { type: "unknown", published: "Precio a consultar en la reserva" },
    officialUrl: "https://www.madridterror.com/", bookingUrl: "https://www.madridterror.com/", sourceUrl: "https://www.madridterror.com/",
    note: "Experiencia inmersiva con actores y varios niveles de intensidad."
  },
  {
    id: "madrid-terror-paranormal", name: "Paranormal Experience", company: "Madrid Terror", area: "Arganzuela",
    address: "Paseo de la Esperanza, 53, Madrid", themes: ["Terror", "Paranormal"], minPlayers: 2, maxPlayers: 7, duration: 90,
    pricing: { type: "unknown", published: "Precio a consultar en la reserva" },
    officialUrl: "https://www.madridterror.com/", bookingUrl: "https://www.madridterror.com/", sourceUrl: "https://www.madridterror.com/",
    note: "Experiencia de terror inmersivo con actores."
  },
  {
    id: "madrid-terror-horror", name: "Horror Club", company: "Madrid Terror", area: "Arganzuela",
    address: "Paseo de la Esperanza, 53, Madrid", themes: ["Terror", "Inmersivo"], minPlayers: 2, maxPlayers: 7, duration: 90,
    pricing: { type: "unknown", published: "Precio a consultar en la reserva" },
    officialUrl: "https://www.madridterror.com/", bookingUrl: "https://www.madridterror.com/", sourceUrl: "https://www.madridterror.com/",
    note: "Show en vivo con actores, luz y sonido."
  },
  {
    id: "madrid-terror-expediente", name: "Expediente Paranormal", company: "Madrid Terror", area: "Arganzuela",
    address: "Paseo de la Esperanza, 53, Madrid", themes: ["Terror", "Hall game"], minPlayers: 8, maxPlayers: 15, duration: 90,
    pricing: { type: "unknown", published: "Precio a consultar en la reserva" },
    officialUrl: "https://www.madridterror.com/", bookingUrl: "https://www.madridterror.com/", sourceUrl: "https://www.madridterror.com/escape-room-grupos-grandes-madrid/",
    note: "Hall escape competitivo diseñado para grupos grandes."
  },
  {
    id: "madrid-terror-saw", name: "Saw Tribute", company: "Madrid Terror", area: "Arganzuela",
    address: "Paseo de la Esperanza, 53, Madrid", themes: ["Terror", "Inmersivo"], minPlayers: 2, maxPlayers: 7, duration: 90,
    pricing: { type: "unknown", published: "Precio a consultar en la reserva" },
    officialUrl: "https://www.madridterror.com/", bookingUrl: "https://www.madridterror.com/", sourceUrl: "https://www.madridterror.com/",
    note: "Experiencia de terror inmersivo; consulta edad e intensidad."
  }
];
