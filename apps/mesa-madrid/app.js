"use strict";

const SOL = { lat: 40.4168, lng: -3.7038 };
const WORLD = { width: 1600, height: 1100, south: 39.96, north: 40.62, west: -4.15, east: -3.26 };
const state = {
  prices: new Set(), allergies: new Set(), zone: "all", maxDistance: 60,
  search: "", sort: "recommended", favoritesOnly: false, selectedId: null,
  favorites: new Set(JSON.parse(localStorage.getItem("mesa-favorites") || "[]")), filtered: []
};
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

function haversineKm(a, b) {
  const rad = d => d * Math.PI / 180, R = 6371;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function validateRestaurants(items) {
  if (!Array.isArray(items)) throw new Error("No se ha podido cargar el conjunto de restaurantes.");
  const ids = new Set();
  const valid = items.filter(r => {
    const coordinateOK = Number.isFinite(r.lat) && Number.isFinite(r.lng) && r.lat >= -90 && r.lat <= 90 && r.lng >= -180 && r.lng <= 180;
    const recordOK = r.id && r.name && r.address && coordinateOK && !ids.has(r.id);
    if (recordOK) ids.add(r.id);
    else console.error("Restaurante descartado por datos inválidos", r);
    return recordOK;
  });
  if (!valid.length) throw new Error("No hay restaurantes con coordenadas válidas.");
  return valid.map(r => ({ ...r, distance: haversineKm(SOL, r) }));
}

class MadridMap {
  constructor(viewport, world, markerLayer, popup) {
    this.viewport = viewport; this.world = world; this.markerLayer = markerLayer; this.popup = popup;
    this.scale = 1; this.x = 0; this.y = 0; this.ready = false; this.drag = null;
    this.items = []; this.onMarkerClick = () => {};
  }
  async init() {
    this.viewport.addEventListener("wheel", e => {
      e.preventDefault();
      const rect = this.viewport.getBoundingClientRect();
      this.zoomAt(e.deltaY < 0 ? 1.22 : 0.82, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });
    this.viewport.addEventListener("pointerdown", e => {
      if (e.target.closest(".map-marker,.map-controls,.map-popup")) return;
      this.viewport.setPointerCapture(e.pointerId);
      this.drag = { px: e.clientX, py: e.clientY, x: this.x, y: this.y };
    });
    this.viewport.addEventListener("pointermove", e => {
      if (!this.drag) return;
      this.x = this.drag.x + e.clientX - this.drag.px; this.y = this.drag.y + e.clientY - this.drag.py;
      this.constrain(); this.updateTransform();
    });
    this.viewport.addEventListener("pointerup", () => this.drag = null);
    this.viewport.addEventListener("pointercancel", () => this.drag = null);
    this.viewport.addEventListener("keydown", e => {
      const amount = e.shiftKey ? 100 : 40;
      if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","+","=","-"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft") this.x += amount;
      if (e.key === "ArrowRight") this.x -= amount;
      if (e.key === "ArrowUp") this.y += amount;
      if (e.key === "ArrowDown") this.y -= amount;
      if (e.key === "+" || e.key === "=") this.zoom(1.25);
      if (e.key === "-") this.zoom(.8);
      this.constrain(); this.updateTransform();
    });
    $("#zoomInBtn").addEventListener("click", () => this.zoom(1.25));
    $("#zoomOutBtn").addEventListener("click", () => this.zoom(.8));
    $("#resetMapBtn").addEventListener("click", () => this.fit(this.items));
    $("#fitMapBtn").addEventListener("click", () => this.fit(this.items));
    this.popup.addEventListener("click", e => {
      if (e.target.closest(".popup-close")) this.closePopup();
      const reserve = e.target.closest("[data-popup-reserve]");
      if (reserve) { e.preventDefault(); openReservation(reserve.dataset.popupReserve); }
    });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    this.ready = true;
    this.updateTransform();
    return this;
  }
  project(item) {
    return {
      x: (item.lng - WORLD.west) / (WORLD.east - WORLD.west) * WORLD.width,
      y: (WORLD.north - item.lat) / (WORLD.north - WORLD.south) * WORLD.height
    };
  }
  updateTransform() {
    this.world.style.transform = `translate(${this.x}px,${this.y}px) scale(${this.scale})`;
    this.markerLayer.style.setProperty("--inv-scale", 1 / this.scale);
  }
  constrain() {
    const w = this.viewport.clientWidth, h = this.viewport.clientHeight;
    const scaledW = WORLD.width * this.scale, scaledH = WORLD.height * this.scale;
    const pad = 80;
    this.x = scaledW <= w ? (w - scaledW) / 2 : Math.min(pad, Math.max(w - scaledW - pad, this.x));
    this.y = scaledH <= h ? (h - scaledH) / 2 : Math.min(pad, Math.max(h - scaledH - pad, this.y));
  }
  zoom(factor) { this.zoomAt(factor, this.viewport.clientWidth / 2, this.viewport.clientHeight / 2); }
  zoomAt(factor, cx, cy) {
    const old = this.scale, next = Math.max(.38, Math.min(4.2, old * factor));
    const wx = (cx - this.x) / old, wy = (cy - this.y) / old;
    this.scale = next; this.x = cx - wx * next; this.y = cy - wy * next;
    this.constrain(); this.updateTransform();
  }
  fit(items) {
    if (!this.ready) return;
    if (!items.length) { this.scale = .48; this.x = (this.viewport.clientWidth - WORLD.width * this.scale) / 2; this.y = (this.viewport.clientHeight - WORLD.height * this.scale) / 2; this.updateTransform(); return; }
    const points = items.map(i => this.project(i));
    let minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
    let minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
    if (maxX - minX < 180) { minX -= 90; maxX += 90; }
    if (maxY - minY < 150) { minY -= 75; maxY += 75; }
    const pad = 70, vw = this.viewport.clientWidth, vh = this.viewport.clientHeight;
    this.scale = Math.max(.42, Math.min(3.2, (vw - pad * 2) / (maxX - minX), (vh - pad * 2) / (maxY - minY)));
    this.x = vw / 2 - ((minX + maxX) / 2) * this.scale;
    this.y = vh / 2 - ((minY + maxY) / 2) * this.scale;
    this.constrain(); this.updateTransform();
  }
  focus(item) {
    if (!item) return;
    const p = this.project(item), vw = this.viewport.clientWidth, vh = this.viewport.clientHeight;
    this.scale = Math.max(this.scale, 2.15);
    this.x = vw / 2 - p.x * this.scale; this.y = vh / 2 - p.y * this.scale;
    this.constrain(); this.updateTransform();
    this.showPopup(item);
  }
  renderMarkers(items, selectedId, onMarkerClick, shouldFit = true) {
    if (!this.ready) throw new Error("Intento de crear marcadores antes de inicializar el mapa.");
    this.items = items; this.onMarkerClick = onMarkerClick;
    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => {
      const p = this.project(item), marker = document.createElement("button");
      marker.className = "map-marker" + (item.id === selectedId ? " selected" : "");
      marker.type = "button"; marker.dataset.id = item.id;
      marker.style.left = `${p.x}px`; marker.style.top = `${p.y}px`; marker.style.zIndex = item.id === selectedId ? 30 : 1 + index % 5;
      marker.setAttribute("aria-label", `${item.name}, ${"€".repeat(item.price)}, ${item.address}`);
      marker.title = `${item.name} · ${"€".repeat(item.price)}`;
      marker.innerHTML = `<span>${item.price}</span>`;
      marker.addEventListener("click", e => { e.stopPropagation(); onMarkerClick(item.id); });
      fragment.appendChild(marker);
    });
    this.markerLayer.replaceChildren(fragment);
    $("#markerCount").textContent = `${items.length} marcador${items.length === 1 ? "" : "es"}`;
    $("#mapStatusText").textContent = `${items.length} restaurantes visibles en el mapa`;
    if (shouldFit) this.fit(items);
    this.updateTransform();
  }
  selectMarker(id) {
    $$(".map-marker", this.markerLayer).forEach(m => m.classList.toggle("selected", m.dataset.id === id));
  }
  showPopup(item) {
    this.popup.hidden = false;
    this.popup.innerHTML = `<button class="popup-close" type="button" aria-label="Cerrar">×</button><h3>${escapeHtml(item.name)}</h3><p><b>${escapeHtml(item.cuisine)} · ${"€".repeat(item.price)}</b></p><p>${escapeHtml(item.address)}, ${escapeHtml(item.area)} · ${item.distance.toFixed(1).replace(".", ",")} km desde Sol</p><a class="popup-reserve" href="#reservar" data-popup-reserve="${item.id}">Reservar mesa</a>`;
  }
  closePopup() { this.popup.hidden = true; }
}

let restaurants = [], map;
function filterAndSort() {
  const query = state.search.trim().toLocaleLowerCase("es");
  const filtered = restaurants.filter(r => {
    const text = `${r.name} ${r.cuisine} ${r.zone} ${r.area} ${r.address} ${r.ambience}`.toLocaleLowerCase("es");
    return (!state.prices.size || state.prices.has(r.price)) &&
      (!state.allergies.size || [...state.allergies].every(a => r.allergyOptions.includes(a))) &&
      (state.zone === "all" || r.zone === state.zone) && r.distance <= state.maxDistance &&
      (!query || text.includes(query)) && (!state.favoritesOnly || state.favorites.has(r.id));
  });
  const sorter = {
    recommended: (a,b) => b.recommended - a.recommended,
    distance: (a,b) => a.distance - b.distance,
    rating: (a,b) => b.rating - a.rating || b.reviews - a.reviews,
    priceAsc: (a,b) => a.price - b.price || b.rating - a.rating
  }[state.sort];
  return filtered.sort(sorter);
}

function renderCard(r) {
  const tags = r.allergyOptions.slice(0, 3).map(a => `<span class="tag">Sin ${escapeHtml(a)}</span>`).join("");
  const more = r.allergyOptions.length > 3 ? `<span class="tag">+${r.allergyOptions.length - 3}</span>` : "";
  return `<article class="restaurant-card${state.selectedId === r.id ? " selected" : ""}" data-id="${r.id}" tabindex="0" aria-label="${escapeHtml(r.name)}, ${r.distance.toFixed(1)} kilómetros">
    <div class="card-visual" style="background:linear-gradient(135deg,${r.color1},${r.color2})">
      <div class="plate" aria-hidden="true">${r.icon}</div><div class="cuisine-label">${escapeHtml(r.cuisine)}</div>
      <span class="distance-badge">${r.distance.toFixed(1).replace(".", ",")} km desde Sol</span>
      <button class="favorite-btn${state.favorites.has(r.id) ? " active" : ""}" type="button" data-action="favorite" aria-label="${state.favorites.has(r.id) ? "Quitar de" : "Añadir a"} favoritos">${state.favorites.has(r.id) ? "♥" : "♡"}</button>
    </div>
    <div class="card-body"><div class="card-meta"><span>${escapeHtml(r.cuisine)} · ${"€".repeat(r.price)}</span><span class="rating">★ ${r.rating.toFixed(1)} (${r.reviews})</span></div>
      <h2>${escapeHtml(r.name)}</h2><p class="address">${escapeHtml(r.address)} · ${escapeHtml(r.area)}<br>${escapeHtml(r.ambience)}</p>
      <div class="tags">${tags}${more}</div><div class="card-actions"><button class="reserve-btn" data-action="reserve" type="button">Reservar mesa</button><button class="locate-btn" data-action="locate" type="button" aria-label="Ver ${escapeHtml(r.name)} en el mapa">⌖</button></div>
    </div></article>`;
}

function renderList() {
  const list = $("#restaurantList");
  if (!state.filtered.length) list.innerHTML = `<div class="empty-state"><b>No hay restaurantes con estos filtros</b><p>Prueba a ampliar la distancia o quitar alguna necesidad alimentaria.</p><button class="clear-btn" data-action="clear">Limpiar filtros</button></div>`;
  else list.innerHTML = state.filtered.map(renderCard).join("");
}

function applyFilters({ fit = true } = {}) {
  state.filtered = filterAndSort();
  if (state.selectedId && !state.filtered.some(r => r.id === state.selectedId)) state.selectedId = null;
  $("#resultCount").textContent = state.filtered.length;
  renderList();
  map.renderMarkers(state.filtered, state.selectedId, id => selectRestaurant(id, "marker"), fit);
  window.__MESA_QA__ = {
    dataCount: restaurants.length, validCoordinates: restaurants.every(r => Number.isFinite(r.lat) && Number.isFinite(r.lng)),
    filteredCount: state.filtered.length, markerCount: $$(".map-marker", $("#markerLayer")).length, mapReady: map.ready
  };
}

function selectRestaurant(id, source) {
  const item = restaurants.find(r => r.id === id); if (!item) return;
  state.selectedId = id;
  $$(".restaurant-card").forEach(c => c.classList.toggle("selected", c.dataset.id === id));
  map.selectMarker(id); map.focus(item);
  if (source === "marker") {
    const card = $(`.restaurant-card[data-id="${CSS.escape(id)}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function clearFilters() {
  state.prices.clear(); state.allergies.clear(); state.zone = "all"; state.maxDistance = 60; state.search = ""; state.favoritesOnly = false;
  $$(".filter-chip").forEach(b => b.setAttribute("aria-pressed", "false"));
  $("#zoneFilter").value = "all"; $("#distanceFilter").value = 60; $("#distanceValue").textContent = 60; $("#searchInput").value = ""; $("#favoritesBtn").setAttribute("aria-pressed", "false");
  applyFilters();
}

function saveFavorites() { localStorage.setItem("mesa-favorites", JSON.stringify([...state.favorites])); $("#favoritesCount").textContent = state.favorites.size; }
function openReservation(id) {
  const r = restaurants.find(x => x.id === id); if (!r) return;
  $("#reservationRestaurantId").value = id; $("#reservationTitle").textContent = `Reservar en ${r.name}`;
  const tomorrow = new Date(Date.now() + 86400000); $("#reservationDate").min = tomorrow.toISOString().slice(0,10); $("#reservationDate").value ||= tomorrow.toISOString().slice(0,10);
  $("#reservationDialog").showModal();
}
function toast(message) { const el = $("#toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2600); }
function getReservations() { return JSON.parse(localStorage.getItem("mesa-reservations") || "[]"); }
function renderReservations() {
  const items = getReservations();
  $("#savedReservations").innerHTML = items.length ? items.map(x => `<div class="saved-item"><strong>${escapeHtml(x.restaurant)}</strong><small>${escapeHtml(x.date)} · ${escapeHtml(x.time)} · ${x.people} personas · ${escapeHtml(x.name)}</small></div>`).join("") : `<p>No hay solicitudes guardadas todavía.</p>`;
}

function bindUI() {
  $$("#priceFilters .filter-chip").forEach(btn => btn.addEventListener("click", () => { const v = Number(btn.dataset.price); state.prices.has(v) ? state.prices.delete(v) : state.prices.add(v); btn.setAttribute("aria-pressed", state.prices.has(v)); applyFilters(); }));
  $$("#allergyFilters .filter-chip").forEach(btn => btn.addEventListener("click", () => { const v = btn.dataset.allergy; state.allergies.has(v) ? state.allergies.delete(v) : state.allergies.add(v); btn.setAttribute("aria-pressed", state.allergies.has(v)); applyFilters(); }));
  $("#zoneFilter").addEventListener("change", e => { state.zone = e.target.value; applyFilters(); });
  $("#distanceFilter").addEventListener("input", e => { state.maxDistance = Number(e.target.value); $("#distanceValue").textContent = state.maxDistance; applyFilters(); });
  let searchTimer; $("#searchInput").addEventListener("input", e => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { state.search = e.target.value; applyFilters(); }, 120); });
  $("#sortSelect").addEventListener("change", e => { state.sort = e.target.value; applyFilters({ fit: false }); });
  $("#clearFiltersBtn").addEventListener("click", clearFilters);
  $("#restaurantList").addEventListener("click", e => {
    if (e.target.closest("[data-action=clear]")) return clearFilters();
    const card = e.target.closest(".restaurant-card"); if (!card) return;
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "favorite") { e.stopPropagation(); state.favorites.has(card.dataset.id) ? state.favorites.delete(card.dataset.id) : state.favorites.add(card.dataset.id); saveFavorites(); renderList(); return; }
    if (action === "reserve") { e.stopPropagation(); return openReservation(card.dataset.id); }
    if (action === "locate") { e.stopPropagation(); $(".content-grid").classList.add("show-map"); $("#mapViewBtn").setAttribute("aria-pressed", "true"); $("#listViewBtn").setAttribute("aria-pressed", "false"); }
    selectRestaurant(card.dataset.id, "card");
  });
  $("#restaurantList").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches(".restaurant-card")) { e.preventDefault(); selectRestaurant(e.target.dataset.id, "card"); }});
  $("#favoritesBtn").addEventListener("click", e => { state.favoritesOnly = !state.favoritesOnly; e.currentTarget.setAttribute("aria-pressed", state.favoritesOnly); applyFilters(); });
  $("#shareBtn").addEventListener("click", async () => { const data = { title: "Mesa Madrid", text: "Mira estos restaurantes de Madrid y alrededores", url: location.href }; try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); toast("Enlace copiado"); } } catch (_) {} });
  $("#reservationsBtn").addEventListener("click", () => { renderReservations(); $("#savedDialog").showModal(); });
  $("#reservationForm").addEventListener("submit", e => {
    e.preventDefault(); if (!e.currentTarget.reportValidity()) return;
    const r = restaurants.find(x => x.id === $("#reservationRestaurantId").value), items = getReservations();
    items.unshift({ id: Date.now(), restaurant: r.name, name: $("#reservationName").value, phone: $("#reservationPhone").value, date: $("#reservationDate").value, time: $("#reservationTime").value, people: $("#reservationPeople").value, notes: $("#reservationNotes").value });
    localStorage.setItem("mesa-reservations", JSON.stringify(items)); $("#reservationDialog").close(); toast("Solicitud guardada en este dispositivo");
  });
  $("#listViewBtn").addEventListener("click", () => { $(".content-grid").classList.remove("show-map"); $("#listViewBtn").setAttribute("aria-pressed", "true"); $("#mapViewBtn").setAttribute("aria-pressed", "false"); });
  $("#mapViewBtn").addEventListener("click", () => { $(".content-grid").classList.add("show-map"); $("#listViewBtn").setAttribute("aria-pressed", "false"); $("#mapViewBtn").setAttribute("aria-pressed", "true"); requestAnimationFrame(() => map.fit(state.filtered)); });
}

async function bootstrap() {
  try {
    restaurants = validateRestaurants(window.RESTAURANTS || []);
    const zones = [...new Set(restaurants.map(r => r.zone))].sort((a,b) => a.localeCompare(b,"es"));
    $("#zoneFilter").insertAdjacentHTML("beforeend", zones.map(z => `<option>${escapeHtml(z)}</option>`).join(""));
    saveFavorites(); bindUI();
    map = new MadridMap($("#mapViewport"), $("#mapWorld"), $("#markerLayer"), $("#mapPopup"));
    await map.init();                 // 1) Inicializa el mapa y espera dos frames de layout.
    applyFilters({ fit: true });      // 2) Solo entonces crea los 100 marcadores.
    console.info("Mesa Madrid QA", window.__MESA_QA__);
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
  } catch (error) {
    console.error(error); $("#mapStatusText").textContent = "No se pudo inicializar el mapa";
    $("#restaurantList").innerHTML = `<div class="empty-state"><b>Error al iniciar la aplicación</b><p>${escapeHtml(error.message)}</p></div>`;
  }
}

document.addEventListener("DOMContentLoaded", bootstrap);
