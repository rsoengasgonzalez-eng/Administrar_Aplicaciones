(() => {
  const rooms = window.ESCAPE_ROOMS || [];
  const Core = window.EscapeMadridCore;
  const $ = (selector) => document.querySelector(selector);
  const els = {
    form: $('#filtersForm'), players: $('#playersInput'), range: $('#playersRange'), theme: $('#themeSelect'),
    budget: $('#budgetInput'), search: $('#searchInput'), unknown: $('#unknownPriceInput'), sort: $('#sortSelect'),
    grid: $('#resultsGrid'), count: $('#resultsCount'), context: $('#resultsContext'), filters: $('#activeFilters'),
    empty: $('#emptyState'), template: $('#cardTemplate'), compare: $('#compareSection'), compareTable: $('#compareTable'),
    toast: $('#toast')
  };
  const selected = new Set();
  const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

  function allThemes() {
    return [...new Set(rooms.flatMap(r => r.themes))].sort((a, b) => a.localeCompare(b, 'es'));
  }

  function setup() {
    $('#catalogCount').textContent = rooms.length;
    $('#companyCount').textContent = new Set(rooms.map(r => r.company)).size;
    $('#themeCount').textContent = allThemes().length;
    for (const theme of allThemes()) {
      const option = document.createElement('option');
      option.value = theme;
      option.textContent = theme;
      els.theme.append(option);
    }
    restoreFromUrl();
    bindEvents();
    render();
  }

  function bindEvents() {
    els.form.addEventListener('submit', (event) => { event.preventDefault(); render(); scrollResults(); });
    [els.players, els.theme, els.budget, els.search, els.unknown, els.sort].forEach(el => {
      el.addEventListener(el === els.search ? 'input' : 'change', render);
    });
    els.range.addEventListener('input', () => { els.players.value = els.range.value; render(); });
    els.players.addEventListener('input', () => {
      const value = clampPlayers(Number(els.players.value) || 2);
      els.range.value = Math.min(value, 20);
      render();
    });
    $('#minusPlayer').addEventListener('click', () => adjustPlayers(-1));
    $('#plusPlayer').addEventListener('click', () => adjustPlayers(1));
    $('#resetButton').addEventListener('click', resetFilters);
    $('#emptyResetButton').addEventListener('click', resetFilters);
    $('#clearCompareButton').addEventListener('click', () => { selected.clear(); render(); });
    $('#shareButton').addEventListener('click', shareSearch);
    window.addEventListener('popstate', () => { restoreFromUrl(); render(); });
  }

  function clampPlayers(value) { return Math.max(2, Math.min(100, Math.round(value))); }
  function adjustPlayers(delta) {
    const value = clampPlayers((Number(els.players.value) || 4) + delta);
    els.players.value = value;
    els.range.value = Math.min(value, 20);
    render();
  }

  function currentFilters() {
    return {
      players: clampPlayers(Number(els.players.value) || 4),
      theme: els.theme.value,
      budget: els.budget.value === '' ? null : Number(els.budget.value),
      query: els.search.value.trim().toLocaleLowerCase('es'),
      includeUnknown: els.unknown.checked,
      sort: els.sort.value
    };
  }

  const priceFor = Core.priceFor;
  const filteredRooms = (filters) => Core.filterAndSort(rooms, filters);

  function render() {
    const filters = currentFilters();
    els.players.value = filters.players;
    els.range.value = Math.min(filters.players, 20);
    const list = filteredRooms(filters);
    els.grid.replaceChildren();
    for (const item of list) els.grid.append(renderCard(item.room, item.price, filters.players));
    els.count.textContent = list.length;
    els.context.textContent = `${filters.players} personas${filters.theme ? ` · ${filters.theme}` : ''}${filters.budget !== null ? ` · hasta ${euro.format(filters.budget)}/persona` : ''}`;
    els.empty.hidden = list.length !== 0;
    els.grid.hidden = list.length === 0;
    renderFilterPills(filters);
    renderCompare(filters.players);
    updateUrl(filters);
  }

  function renderCard(room, price, players) {
    const node = els.template.content.cloneNode(true);
    const article = node.querySelector('.escape-card');
    article.dataset.id = room.id;
    node.querySelector('.company').textContent = room.company;
    node.querySelector('.escape-name').textContent = room.name;
    node.querySelector('.location').textContent = room.area;
    node.querySelector('.players-fact').textContent = `${room.minPlayers}–${room.maxPlayers} personas`;
    node.querySelector('.duration-fact').textContent = `${room.duration} min`;
    const chips = node.querySelector('.theme-chips');
    room.themes.forEach(theme => {
      const chip = document.createElement('span');
      chip.className = 'theme-chip';
      chip.textContent = theme;
      chips.append(chip);
    });
    node.querySelector('.total-price').textContent = price.known ? `${price.exact ? '' : '≈ '}${euro.format(price.total)}` : 'Consultar';
    node.querySelector('.person-price').textContent = price.known ? `${price.exact ? '' : '≈ '}${euro.format(price.pp)}` : 'Consultar';
    node.querySelector('.price-note').textContent = price.note;
    node.querySelector('.published-price').innerHTML = `<strong>Precio publicado:</strong> ${escapeHtml(room.pricing.published)}`;
    node.querySelector('.address').innerHTML = `<strong>Dirección:</strong> ${escapeHtml(room.address)}`;
    node.querySelector('.room-note').textContent = room.note || '';
    node.querySelector('.updated').textContent = 'Catálogo revisado: 08/11/2026';
    setLink(node.querySelector('.official-link'), room.officialUrl);
    setLink(node.querySelector('.booking-link'), room.bookingUrl || room.officialUrl);
    setLink(node.querySelector('.source-link'), room.sourceUrl);
    setLink(node.querySelector('.map-link'), `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${room.name} ${room.address}`)}`);
    const compareButton = node.querySelector('.compare-toggle');
    const isSelected = selected.has(room.id);
    compareButton.setAttribute('aria-pressed', String(isSelected));
    compareButton.textContent = isSelected ? '✓ Comparando' : '+ Comparar';
    compareButton.addEventListener('click', () => toggleCompare(room.id));
    return node;
  }

  function setLink(anchor, url) {
    if (!url) { anchor.hidden = true; return; }
    anchor.href = url;
  }

  function toggleCompare(id) {
    if (selected.has(id)) selected.delete(id);
    else if (selected.size < 3) selected.add(id);
    else { showToast('Puedes comparar un máximo de 3 experiencias.'); return; }
    render();
    if (selected.size >= 2) els.compare.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderCompare(players) {
    const chosen = rooms.filter(room => selected.has(room.id));
    els.compare.hidden = chosen.length < 2;
    if (chosen.length < 2) return;
    const rows = [
      ['Empresa', ...chosen.map(r => r.company)],
      ['Temática', ...chosen.map(r => r.themes.join(', '))],
      ['Capacidad', ...chosen.map(r => `${r.minPlayers}–${r.maxPlayers}`)],
      [`Total (${players} personas)`, ...chosen.map(r => formatComparePrice(priceFor(r, players), 'total'))],
      ['Por persona', ...chosen.map(r => formatComparePrice(priceFor(r, players), 'pp'))],
      ['Duración', ...chosen.map(r => `${r.duration} min`)],
      ['Zona', ...chosen.map(r => r.area)],
      ['Acción', ...chosen.map(r => `<a href="${escapeAttribute(r.officialUrl)}" target="_blank" rel="noopener noreferrer">Abrir web ↗</a>`)]
    ];
    els.compareTable.innerHTML = `<thead><tr><th>Dato</th>${chosen.map(r => `<th>${escapeHtml(r.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>`;
  }

  function formatComparePrice(price, key) {
    if (!price.known) return 'Consultar';
    return `${price.exact ? '' : '≈ '}${euro.format(price[key])}`;
  }

  function renderFilterPills(filters) {
    const pills = [`${filters.players} personas`];
    if (filters.theme) pills.push(filters.theme);
    if (filters.budget !== null) pills.push(`≤ ${euro.format(filters.budget)}/persona`);
    if (filters.query) pills.push(`“${filters.query}”`);
    if (!filters.includeUnknown) pills.push('Solo precios disponibles');
    els.filters.innerHTML = pills.map(pill => `<span class="filter-pill">${escapeHtml(pill)}</span>`).join('');
  }

  function resetFilters() {
    els.players.value = 4;
    els.range.value = 4;
    els.theme.value = '';
    els.budget.value = '';
    els.search.value = '';
    els.unknown.checked = true;
    els.sort.value = 'recommended';
    render();
  }

  function updateUrl(filters) {
    const params = new URLSearchParams();
    params.set('personas', filters.players);
    if (filters.theme) params.set('tema', filters.theme);
    if (filters.budget !== null) params.set('precio', filters.budget);
    if (filters.query) params.set('q', filters.query);
    if (!filters.includeUnknown) params.set('sinConsultar', '1');
    if (filters.sort !== 'recommended') params.set('orden', filters.sort);
    const url = `${location.pathname}?${params.toString()}${location.hash}`;
    history.replaceState(null, '', url);
  }

  function restoreFromUrl() {
    const params = new URLSearchParams(location.search);
    if (params.has('personas')) els.players.value = clampPlayers(Number(params.get('personas')) || 4);
    if (params.has('tema')) els.theme.value = params.get('tema');
    if (params.has('precio')) els.budget.value = params.get('precio');
    if (params.has('q')) els.search.value = params.get('q');
    if (params.has('sinConsultar')) els.unknown.checked = false;
    if (params.has('orden')) els.sort.value = params.get('orden');
  }

  async function shareSearch() {
    render();
    try {
      await navigator.clipboard.writeText(location.href);
      showToast('Enlace de la búsqueda copiado.');
    } catch {
      showToast('Copia la URL del navegador para compartir la búsqueda.');
    }
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2500);
  }

  function scrollResults() { $('#resultados').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function escapeAttribute(value) { return escapeHtml(value); }

  setup();
})();
