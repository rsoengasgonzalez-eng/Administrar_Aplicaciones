const state = {
  user: loadStoredUser(),
  songs: [],
  top: [],
  genres: [],
  playlists: [],
  stats: {},
  period: "week",
  search: "",
  genre: "",
  sort: "recent",
  currentSong: null,
  selectedSongId: null
};

const els = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheElements();
  bindEvents();
  renderUser();
  await refresh();
  if (!state.user) els.userDialog.showModal();
}

function cacheElements() {
  [
    "userDialog", "songDialog", "playlistDialog", "playlistDetailDialog", "addToPlaylistDialog",
    "userForm", "songForm", "playlistForm", "globalSearch", "genreFilter", "sortFilter",
    "statsGrid", "topSongs", "recentSongs", "genreRail", "exploreSongs", "playlistGrid",
    "profileHeader", "profileStats", "profileSongs", "sidebarUser", "userPill", "songGenre",
    "player", "playerArtwork", "playerTitle", "playerArtist", "playerLike", "playerOpen", "playerNext",
    "playlistDetail", "playlistChoices", "changeUser", "toastRegion"
  ].forEach((id) => { els[id] = document.getElementById(id); });
}

function bindEvents() {
  document.addEventListener("click", handleDocumentClick);
  els.userForm.addEventListener("submit", submitUser);
  els.songForm.addEventListener("submit", submitSong);
  els.playlistForm.addEventListener("submit", submitPlaylist);
  els.globalSearch.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLocaleLowerCase("es");
    if (state.search) switchView("explore");
    renderExplore();
  });
  els.genreFilter.addEventListener("change", (event) => {
    state.genre = event.target.value;
    renderExplore();
  });
  els.sortFilter.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderExplore();
  });
  els.changeUser.addEventListener("click", () => {
    localStorage.removeItem("musichub_user");
    state.user = null;
    renderUser();
    els.userDialog.showModal();
  });
  els.playerOpen.addEventListener("click", () => state.currentSong && openEmbed(state.currentSong));
  els.playerNext.addEventListener("click", playRandom);
  els.playerLike.addEventListener("click", () => state.currentSong && likeSong(state.currentSong.id));

  document.querySelectorAll("dialog:not([data-static])").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

async function handleDocumentClick(event) {
  const button = event.target.closest("button, a");
  if (!button) return;

  if (button.dataset.view) switchView(button.dataset.view);
  if (button.dataset.viewLink) {
    event.preventDefault();
    switchView(button.dataset.viewLink);
  }

  const action = button.dataset.action;
  if (action === "open-add") requireUser(() => els.songDialog.showModal());
  if (action === "open-playlist") requireUser(() => els.playlistDialog.showModal());
  if (action === "radio") playRandom();
  if (button.dataset.close !== undefined) button.closest("dialog")?.close();

  if (button.dataset.period) {
    state.period = button.dataset.period;
    document.querySelectorAll("[data-period]").forEach((item) => item.classList.toggle("active", item === button));
    await refresh();
  }
  if (button.dataset.genre) {
    state.genre = button.dataset.genre;
    els.genreFilter.value = state.genre;
    switchView("explore");
    renderExplore();
  }
  if (button.dataset.songPlay) {
    const song = state.songs.find((item) => item.id === button.dataset.songPlay)
      || state.top.find((item) => item.id === button.dataset.songPlay);
    if (song) await playSong(song);
  }
  if (button.dataset.songLike) await likeSong(button.dataset.songLike);
  if (button.dataset.songPlaylist) openAddToPlaylist(button.dataset.songPlaylist);
  if (button.dataset.playlistOpen) await openPlaylist(button.dataset.playlistOpen);
  if (button.dataset.playlistChoice) await addSelectedSongToPlaylist(button.dataset.playlistChoice);
}

async function refresh() {
  try {
    const query = new URLSearchParams({ period: state.period });
    if (state.user?.id) query.set("user", state.user.id);
    const data = await api(`/api/bootstrap?${query}`);
    Object.assign(state, {
      songs: data.songs,
      top: data.top,
      genres: data.genres,
      playlists: data.playlists,
      stats: data.stats
    });
    renderAll();
  } catch (error) {
    toast(error.message, "error");
    renderOffline(error.message);
  }
}

function renderAll() {
  renderUser();
  renderStats();
  renderTop();
  renderRecent();
  renderGenres();
  renderFilters();
  renderExplore();
  renderPlaylists();
  renderProfile();
  syncCurrentSong();
}

function renderUser() {
  if (!state.user) {
    els.sidebarUser.innerHTML = "";
    els.userPill.innerHTML = '<span class="avatar small">?</span><span>Entrar</span>';
    return;
  }
  const user = state.user;
  const avatar = avatarHtml(user, "small");
  els.sidebarUser.innerHTML = `<div class="mini-user">${avatar}<div><strong>${escapeHtml(user.alias)}</strong><small>Miembro del grupo</small></div></div>`;
  els.userPill.innerHTML = `${avatar}<span>${escapeHtml(user.alias)}</span>`;
}

function renderStats() {
  const cards = [
    ["♫", state.stats.songs || 0, "canciones"],
    ["▶", state.stats.plays || 0, "reproducciones"],
    ["◎", state.stats.users || 0, "miembros"],
    ["≡", state.stats.playlists || 0, "playlists"]
  ];
  els.statsGrid.innerHTML = cards.map(([icon, number, label]) => `
    <article class="stat-card"><span class="stat-icon">${icon}</span><div><strong>${formatNumber(number)}</strong><span>${label}</span></div></article>
  `).join("");
}

function renderTop() {
  if (!state.top.length || !state.top.some((song) => Number(song.plays) > 0)) {
    els.topSongs.innerHTML = emptyState("El ranking está esperando", "Las reproducciones del grupo aparecerán aquí.", "radio", "▶ Estrenar la radio");
    return;
  }
  els.topSongs.innerHTML = state.top.map((song, index) => topRow(song, index + 1)).join("");
}

function renderRecent() {
  if (!state.songs.length) {
    els.recentSongs.innerHTML = emptyState("Todavía no hay canciones", "Sé la primera persona en compartir una.", "open-add", "＋ Añadir canción");
    return;
  }
  els.recentSongs.innerHTML = state.songs.slice(0, 10).map(songCard).join("");
}

function renderGenres() {
  const colors = [
    "linear-gradient(135deg,#7c3aed,#4c1d95)", "linear-gradient(135deg,#db2777,#831843)",
    "linear-gradient(135deg,#2563eb,#1e3a8a)", "linear-gradient(135deg,#ea580c,#7c2d12)",
    "linear-gradient(135deg,#059669,#064e3b)", "linear-gradient(135deg,#0891b2,#164e63)"
  ];
  els.genreRail.innerHTML = state.genres.filter((genre) => Number(genre.song_count) > 0).slice(0, 6).map((genre, index) => `
    <button class="genre-card" style="background:${colors[index % colors.length]}" data-genre="${escapeAttr(genre.slug)}">
      ${escapeHtml(genre.name)}<span>${formatNumber(genre.song_count)} canciones</span>
    </button>
  `).join("") || emptyState("Sin géneros todavía", "Aparecerán cuando añadáis canciones.");
}

function renderFilters() {
  const current = els.genreFilter.value || state.genre;
  els.genreFilter.innerHTML = '<option value="">Todos los géneros</option>' + state.genres.map((genre) => `
    <option value="${escapeAttr(genre.slug)}">${escapeHtml(genre.name)} (${formatNumber(genre.song_count)})</option>
  `).join("");
  els.genreFilter.value = current;
  els.songGenre.innerHTML = '<option value="">Selecciona…</option>' + state.genres.map((genre) => `
    <option value="${genre.id}">${escapeHtml(genre.name)}</option>
  `).join("");
}

function renderExplore() {
  const filtered = state.songs.filter((song) => {
    const haystack = `${song.title} ${song.artist} ${song.genre} ${song.added_by}`.toLocaleLowerCase("es");
    return (!state.search || haystack.includes(state.search)) && (!state.genre || song.genre_slug === state.genre);
  });
  const sorted = [...filtered].sort((a, b) => {
    if (state.sort === "plays") return Number(b.plays) - Number(a.plays);
    if (state.sort === "likes") return Number(b.likes) - Number(a.likes);
    if (state.sort === "title") return a.title.localeCompare(b.title, "es");
    return String(b.created_at).localeCompare(String(a.created_at));
  });
  els.exploreSongs.innerHTML = sorted.length
    ? sorted.map(libraryRow).join("")
    : emptyState("No hay resultados", "Prueba con otra búsqueda o comparte una canción.", "open-add", "＋ Añadir canción");
}

function renderPlaylists() {
  els.playlistGrid.innerHTML = state.playlists.length ? state.playlists.map((playlist) => `
    <button class="playlist-card" data-playlist-open="${playlist.id}">
      <span class="playlist-symbol">♫</span>
      <h3>${escapeHtml(playlist.name)}</h3>
      <p>${escapeHtml(playlist.description || (playlist.is_collaborative ? "Playlist colaborativa" : "Playlist personal"))}</p>
      <small>${formatNumber(playlist.song_count)} canciones · ${escapeHtml(playlist.owner)}</small>
    </button>
  `).join("") : emptyState("Cread vuestra primera playlist", "Podéis hacerla colaborativa para construirla entre todos.", "open-playlist", "＋ Nueva playlist");
}

function renderProfile() {
  if (!state.user) {
    els.profileHeader.innerHTML = '<div><h1>Tu perfil</h1><p>Entra con un alias para ver tus aportaciones.</p></div>';
    els.profileStats.innerHTML = "";
    els.profileSongs.innerHTML = emptyState("Aún no has entrado", "Tu actividad aparecerá aquí.");
    return;
  }
  const mine = state.songs.filter((song) => song.added_by_id === state.user.id);
  const receivedLikes = mine.reduce((sum, song) => sum + Number(song.likes), 0);
  const receivedPlays = mine.reduce((sum, song) => sum + Number(song.plays), 0);
  els.profileHeader.innerHTML = `${avatarHtml(state.user, "large")}<div><span class="eyebrow">PERFIL MUSICAL</span><h1>${escapeHtml(state.user.alias)}</h1><p>Compartiendo la música que merece sonar.</p></div>`;
  els.profileStats.innerHTML = [
    ["♫", mine.length, "canciones compartidas"], ["▶", receivedPlays, "escuchas recibidas"],
    ["♡", receivedLikes, "favoritos recibidos"], ["≡", state.playlists.filter((p) => p.owner_id === state.user.id).length, "playlists creadas"]
  ].map(([icon, value, label]) => `<article class="stat-card"><span class="stat-icon">${icon}</span><div><strong>${formatNumber(value)}</strong><span>${label}</span></div></article>`).join("");
  els.profileSongs.innerHTML = mine.length ? mine.map(libraryRow).join("") : emptyState("Aún no has compartido música", "Tu primera aportación puede ser el próximo número uno.", "open-add", "＋ Añadir canción");
}

function topRow(song, rank) {
  return `<article class="top-row">
    <span class="rank">${rank}</span>${coverHtml(song)}
    <div class="row-main"><strong>${escapeHtml(song.title)}</strong><span>${escapeHtml(song.artist)}</span></div>
    <span class="cell-muted cell-genre">${escapeHtml(song.genre)}</span>
    <span class="metric plays">▶ ${formatNumber(song.plays)}</span>
    <span class="metric likes">♡ ${formatNumber(song.likes)}</span>
    <div class="row-actions"><button class="row-button play-row" data-song-play="${song.id}" aria-label="Reproducir ${escapeAttr(song.title)}">▶</button></div>
  </article>`;
}

function libraryRow(song) {
  return `<article class="library-row">
    ${coverHtml(song)}
    <div class="row-main"><strong>${escapeHtml(song.title)}</strong><span>${escapeHtml(song.artist)} · por ${escapeHtml(song.added_by || "el grupo")}</span></div>
    <span class="cell-muted cell-genre">${escapeHtml(song.genre)}</span>
    <span class="metric">▶ ${formatNumber(song.plays)}</span>
    <span class="metric">♡ ${formatNumber(song.likes)}</span>
    <div class="row-actions">
      <button class="row-button ${Number(song.liked) ? "liked" : ""}" data-song-like="${song.id}" aria-label="Favorito">${Number(song.liked) ? "♥" : "♡"}</button>
      <button class="row-button" data-song-playlist="${song.id}" aria-label="Añadir a playlist">＋</button>
      <button class="row-button play-row" data-song-play="${song.id}" aria-label="Reproducir">▶</button>
    </div>
  </article>`;
}

function songCard(song) {
  return `<article class="song-card">
    <div class="song-cover">${coverContent(song)}<button class="card-play" data-song-play="${song.id}" aria-label="Reproducir ${escapeAttr(song.title)}">▶</button></div>
    <strong>${escapeHtml(song.title)}</strong><span>${escapeHtml(song.artist)}</span>
    <div class="card-meta"><span>${escapeHtml(song.genre)}</span><span>▶ ${formatNumber(song.plays)}</span></div>
  </article>`;
}

function coverHtml(song) {
  return `<div class="cover">${coverContent(song)}</div>`;
}

function coverContent(song) {
  return song.cover_url
    ? `<img src="${escapeAttr(song.cover_url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
    : `<span>${escapeHtml((song.title || "M").charAt(0).toUpperCase())}</span>`;
}

async function submitUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector("[data-form-status]");
  setBusy(form, true, status);
  try {
    const formData = new FormData(form);
    const data = await api("/api/users", { method: "POST", body: { alias: formData.get("alias") } });
    state.user = data.user;
    localStorage.setItem("musichub_user", JSON.stringify(data.user));
    els.userDialog.close();
    form.reset();
    toast(data.created ? "¡Bienvenido a MusicHub!" : `Hola de nuevo, ${data.user.alias}.`, "success");
    await refresh();
  } catch (error) {
    status.textContent = error.message;
  } finally { setBusy(form, false); }
}

async function submitSong(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector("[data-form-status]");
  setBusy(form, true, status);
  try {
    const values = Object.fromEntries(new FormData(form));
    await api("/api/songs", { method: "POST", body: { ...values, userId: state.user.id } });
    els.songDialog.close();
    form.reset();
    toast("Canción compartida con el grupo.", "success");
    await refresh();
  } catch (error) {
    status.textContent = error.message;
  } finally { setBusy(form, false); }
}

async function submitPlaylist(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector("[data-form-status]");
  setBusy(form, true, status);
  try {
    const data = new FormData(form);
    await api("/api/playlists", { method: "POST", body: {
      name: data.get("name"), description: data.get("description"),
      collaborative: data.has("collaborative"), userId: state.user.id
    }});
    els.playlistDialog.close();
    form.reset();
    form.elements.collaborative.checked = true;
    toast("Playlist creada.", "success");
    await refresh();
  } catch (error) {
    status.textContent = error.message;
  } finally { setBusy(form, false); }
}

async function playSong(song) {
  state.currentSong = song;
  renderPlayer();
  try {
    const data = await api(`/api/songs/${song.id}/play`, { method: "POST", body: { userId: state.user?.id || null } });
    updateSongMetrics(song.id, { plays: data.plays });
    renderTop();
    renderExplore();
  } catch (error) {
    toast(`No se pudo registrar la escucha: ${error.message}`, "error");
  }
  openEmbed(song);
}

function playRandom() {
  if (!state.songs.length) {
    toast("Añadid una canción para estrenar la radio.", "error");
    requireUser(() => els.songDialog.showModal());
    return;
  }
  const candidates = state.songs.filter((song) => song.id !== state.currentSong?.id);
  const list = candidates.length ? candidates : state.songs;
  playSong(list[Math.floor(Math.random() * list.length)]);
}

async function likeSong(songId) {
  if (!state.user) return requireUser();
  try {
    const data = await api(`/api/songs/${songId}/like`, { method: "POST", body: { userId: state.user.id } });
    updateSongMetrics(songId, { likes: data.likes, liked: data.liked ? 1 : 0 });
    renderExplore();
    renderRecent();
    renderProfile();
    renderPlayer();
  } catch (error) { toast(error.message, "error"); }
}

function openAddToPlaylist(songId) {
  requireUser(() => {
    state.selectedSongId = songId;
    els.playlistChoices.innerHTML = state.playlists.length ? state.playlists.map((playlist) => `
      <button class="choice-button" data-playlist-choice="${playlist.id}"><span>${escapeHtml(playlist.name)}</span><small>${formatNumber(playlist.song_count)} canciones</small></button>
    `).join("") : emptyState("No hay playlists", "Crea una primero desde la sección Playlists.");
    els.addToPlaylistDialog.showModal();
  });
}

async function addSelectedSongToPlaylist(playlistId) {
  const status = els.addToPlaylistDialog.querySelector("[data-choice-status]");
  status.textContent = "Añadiendo…";
  try {
    await api(`/api/playlists/${playlistId}/songs`, { method: "POST", body: { songId: state.selectedSongId, userId: state.user.id } });
    els.addToPlaylistDialog.close();
    toast("Canción añadida a la playlist.", "success");
    await refresh();
  } catch (error) { status.textContent = error.message; }
}

async function openPlaylist(id) {
  try {
    const data = await api(`/api/playlists/${id}`);
    els.playlistDetail.innerHTML = `
      <header class="playlist-detail-header"><span class="eyebrow">PLAYLIST ${data.playlist.is_collaborative ? "COLABORATIVA" : "PERSONAL"}</span>
      <h2>${escapeHtml(data.playlist.name)}</h2><p>${escapeHtml(data.playlist.description || "Sin descripción")}</p><small>Creada por ${escapeHtml(data.playlist.owner)}</small></header>
      <div class="library-list">${data.songs.length ? data.songs.map(libraryRow).join("") : emptyState("Playlist vacía", "Añade canciones desde la biblioteca con el botón ＋.")}</div>`;
    els.playlistDetailDialog.showModal();
  } catch (error) { toast(error.message, "error"); }
}

function openEmbed(song) {
  let dialog = document.getElementById("mediaDialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "mediaDialog";
    dialog.className = "modal";
    dialog.innerHTML = `<div class="modal-card modal-wide"><button class="modal-close" type="button" data-close aria-label="Cerrar">×</button><div id="mediaContent"></div></div>`;
    dialog.addEventListener("close", () => { document.getElementById("mediaContent").innerHTML = ""; });
    document.body.appendChild(dialog);
  }
  const src = embedUrl(song);
  document.getElementById("mediaContent").innerHTML = `
    <span class="eyebrow">REPRODUCIENDO DESDE ${escapeHtml(song.provider.toUpperCase())}</span>
    <h2>${escapeHtml(song.title)}</h2><p>${escapeHtml(song.artist)}</p>
    <iframe title="Reproductor de ${escapeAttr(song.title)}" src="${escapeAttr(src)}" width="100%" height="${song.provider === "spotify" ? "352" : "380"}" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="eager" style="border-radius:14px;background:#09080e"></iframe>
    <p><a href="${escapeAttr(song.url)}" target="_blank" rel="noopener noreferrer" style="color:#a78bfa">Abrir en ${escapeHtml(providerName(song.provider))} ↗</a></p>`;
  dialog.showModal();
}

function embedUrl(song) {
  const url = new URL(song.url);
  if (song.provider === "youtube") {
    let id = url.hostname.includes("youtu.be") ? url.pathname.slice(1).split("/")[0] : url.searchParams.get("v");
    if (!id && url.pathname.includes("/shorts/")) id = url.pathname.split("/shorts/")[1]?.split("/")[0];
    if (!id && url.pathname.includes("/embed/")) id = url.pathname.split("/embed/")[1]?.split("/")[0];
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0` : song.url;
  }
  if (song.provider === "spotify") {
    const parts = url.pathname.split("/").filter(Boolean);
    const typeIndex = parts.findIndex((part) => ["track", "album", "playlist", "episode", "show"].includes(part));
    return typeIndex >= 0 ? `https://open.spotify.com/embed/${parts[typeIndex]}/${encodeURIComponent(parts[typeIndex + 1] || "")}` : song.url;
  }
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(song.url)}&auto_play=true&hide_related=true&show_comments=false`;
}

function renderPlayer() {
  const song = state.currentSong;
  if (!song) return;
  els.player.classList.remove("hidden");
  els.playerTitle.textContent = song.title;
  els.playerArtist.textContent = song.artist;
  els.playerArtwork.innerHTML = coverContent(song);
  els.playerLike.classList.toggle("liked", Boolean(Number(song.liked)));
  els.playerLike.textContent = Number(song.liked) ? "♥" : "♡";
}

function syncCurrentSong() {
  if (!state.currentSong) return;
  state.currentSong = state.songs.find((song) => song.id === state.currentSong.id) || state.currentSong;
  renderPlayer();
}

function updateSongMetrics(songId, patch) {
  [state.songs, state.top].forEach((list) => {
    const song = list.find((item) => item.id === songId);
    if (song) Object.assign(song, patch);
  });
  if (state.currentSong?.id === songId) Object.assign(state.currentSong, patch);
}

function switchView(name) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${name}`));
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function requireUser(callback) {
  if (!state.user) {
    els.userDialog.showModal();
    return false;
  }
  callback?.();
  return true;
}

function renderOffline(message) {
  const html = emptyState("No se pudo conectar con la base de datos", message);
  els.topSongs.innerHTML = html;
  els.recentSongs.innerHTML = html;
  els.exploreSongs.innerHTML = html;
  els.playlistGrid.innerHTML = html;
}

function emptyState(title, text, action, label) {
  return `<div class="empty-state"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span>${action ? `<br><button class="button button-primary" data-action="${action}">${escapeHtml(label)}</button>` : ""}</div>`;
}

function avatarHtml(user, size) {
  return `<span class="avatar ${size}" style="--avatar:${escapeAttr(user.avatar_color || "#7c3aed")}">${escapeHtml(user.alias.slice(0, 2))}</span>`;
}

function setBusy(form, busy, status) {
  form.querySelectorAll("button, input, select, textarea").forEach((element) => { element.disabled = busy; });
  if (status && busy) status.textContent = "Guardando…";
}

const API_BASE = "/api/music-hub";

async function api(path, options = {}) {
  const config = { method: options.method || "GET", headers: { accept: "application/json" } };
  if (options.body !== undefined) {
    config.headers["content-type"] = "application/json";
    config.body = JSON.stringify(options.body);
  }
  const response = await fetch(`${API_BASE}${path}`, config);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Error ${response.status}`);
  return data;
}

function loadStoredUser() {
  try { return JSON.parse(localStorage.getItem("musichub_user")) || null; }
  catch { return null; }
}

function providerName(provider) {
  return ({ youtube: "YouTube", spotify: "Spotify", soundcloud: "SoundCloud" })[provider] || provider;
}

function formatNumber(number) {
  return new Intl.NumberFormat("es-ES", { notation: Number(number) > 9999 ? "compact" : "standard" }).format(Number(number) || 0);
}

function toast(message, type = "success") {
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  els.toastRegion.appendChild(item);
  setTimeout(() => item.remove(), 3500);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
