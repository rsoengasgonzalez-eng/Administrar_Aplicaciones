((root) => {
  function priceFor(room, players) {
    const pricing = room.pricing;
    if (!pricing || pricing.type === 'unknown') return { known: false, exact: false, total: null, pp: null, note: 'Precio a consultar' };
    if (pricing.type === 'perPerson') {
      return { known: true, exact: true, total: pricing.amount * players, pp: pricing.amount, note: 'Precio publicado por persona' };
    }
    if (pricing.type === 'fromPerPerson') {
      return { known: true, exact: false, total: pricing.amount * players, pp: pricing.amount, note: 'Precio mínimo publicado' };
    }
    if (pricing.type === 'table') {
      const total = Number(pricing.values[players]);
      return { known: Number.isFinite(total), exact: true, total, pp: total / players, note: 'Precio publicado para este tamaño de grupo' };
    }
    if (pricing.type === 'range') {
      const span = Math.max(1, room.maxPlayers - room.minPlayers);
      const position = (players - room.minPlayers) / span;
      const total = pricing.minTotal + (pricing.maxTotal - pricing.minTotal) * position;
      return { known: true, exact: false, total, pp: total / players, note: 'Estimación lineal sobre el rango publicado' };
    }
    return { known: false, exact: false, total: null, pp: null, note: 'Precio a consultar' };
  }

  function score(room, price, filters) {
    let value = 100;
    const middle = (room.minPlayers + room.maxPlayers) / 2;
    value -= Math.abs(filters.players - middle) * 1.4;
    if (price.known) value += Math.max(0, 28 - price.pp);
    if (price.exact) value += 8;
    if (filters.theme && room.themes.includes(filters.theme)) value += 15;
    if (room.duration > 60) value += Math.min(8, (room.duration - 60) / 5);
    return value;
  }

  function filterAndSort(rooms, filters) {
    const filtered = rooms.filter(room => {
      if (filters.players < room.minPlayers || filters.players > room.maxPlayers) return false;
      if (filters.theme && !room.themes.includes(filters.theme)) return false;
      if (filters.query) {
        const haystack = [room.name, room.company, room.area, room.address, room.note, ...room.themes].join(' ').toLocaleLowerCase('es');
        if (!haystack.includes(filters.query)) return false;
      }
      const price = priceFor(room, filters.players);
      if (!filters.includeUnknown && !price.known) return false;
      if (filters.budget !== null && (!price.known || price.pp > filters.budget)) return false;
      return true;
    }).map(room => ({ room, price: priceFor(room, filters.players) }));

    const comparators = {
      recommended: (a, b) => score(b.room, b.price, filters) - score(a.room, a.price, filters),
      'price-asc': (a, b) => (a.price.pp ?? Infinity) - (b.price.pp ?? Infinity),
      'capacity-desc': (a, b) => b.room.maxPlayers - a.room.maxPlayers,
      'duration-desc': (a, b) => b.room.duration - a.room.duration,
      'name-asc': (a, b) => a.room.name.localeCompare(b.room.name, 'es')
    };
    return filtered.sort(comparators[filters.sort] || comparators.recommended);
  }

  root.EscapeMadridCore = { priceFor, score, filterAndSort };
})(typeof window !== 'undefined' ? window : globalThis);
