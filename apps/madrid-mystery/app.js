const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const storage = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

let game = null;
let profile = storage.get('mm-profile');
let serverOffset = 0;
let timerHandle = null;
let refreshing = false;
const API_BASE = '/api/madrid-mystery';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character]));
}

async function api(path, options = {}) {
  const headers = { 'content-type':'application/json', ...(options.headers || {}) };
  if (profile?.token) headers.authorization = 'Bearer ' + profile.token;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'No se pudo completar la operación.');
    error.code = data.code;
    error.data = data;
    throw error;
  }
  return data;
}

function now() { return Date.now() + serverOffset; }
function pad(value) { return String(Math.max(0, value)).padStart(2, '0'); }
function duration(milliseconds) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return days ? `${days} d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
function shortDuration(milliseconds) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours} h ${minutes} min` : `${minutes} min`;
}
function dateTime(value) {
  return new Intl.DateTimeFormat('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Madrid' }).format(new Date(value));
}
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 3000);
}

function setProfileUi() {
  $('#profileInitial').textContent = profile?.alias?.charAt(0).toUpperCase() || '?';
  $('#aliasInput').value = profile?.alias || '';
  $('#profileNote').textContent = profile?.team?.name ? `Equipo: ${profile.team.name}.` : 'La asignación se realizará al registrar el alias.';
  if ($('#teamPill')) $('#teamPill').textContent = profile?.team?.name || 'Equipo automático';
}

function fillSelect(selector, items, valueKey, labelKey) {
  const select = $(selector);
  select.querySelectorAll('option:not(:first-child)').forEach(option => option.remove());
  items.forEach(item => {
    const option = document.createElement('option');
    option.value = typeof item === 'string' ? item : item[valueKey];
    option.textContent = typeof item === 'string' ? item : item[labelKey];
    select.append(option);
  });
}

function renderMissions() {
  const progress = game.teamProgress;
  const missions = progress?.missions || game.case.missions.map(mission => ({ ...mission, status:'locked', attempts:0 }));
  const completed = progress?.completedCount || 0;
  $('#missionBadge').textContent = `${completed}/${game.rules.missionCount}`;
  $('#missionCount').textContent = `${completed} de ${game.rules.missionCount}`;
  $('#missionNotice').textContent = !profile
    ? 'Registra tu alias para sincronizar el progreso persistente de tu equipo.'
    : progress?.state?.status === 'finished'
      ? `Vuestro equipo terminó el expediente el ${dateTime(progress.state.finishedAt)}.`
      : `El progreso es compartido por ${game.team?.name || profile.team?.name || 'tu equipo'} y se guarda en D1.`;
  $('#missionList').innerHTML = missions.map(mission => {
    const status = mission.status || 'locked';
    const statusText = status === 'completed' ? 'Completada' : status === 'available' ? 'Disponible' : `Requiere pista ${mission.unlockAfterClue}`;
    const form = status === 'available' && progress?.state?.status !== 'finished' ? `
      <form class="mission-form" data-mission-id="${escapeHtml(mission.id)}">
        <select required><option value="">Selecciona una respuesta</option>${mission.options.map(option => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select>
        <button class="primary" type="submit">Comprobar</button>
      </form>` : '';
    return `<article class="mission-card ${status}">
      <span class="mission-state">${status === 'completed' ? '✓' : pad(mission.order)}</span>
      <div><span class="mission-meta">${statusText} · ${mission.attempts || 0} intentos</span><h3>${escapeHtml(mission.title)}</h3><p>${escapeHtml(mission.prompt)}</p>${form}</div>
    </article>`;
  }).join('');
}

function renderTeamStatus() {
  const card = $('#teamStatusCard');
  if (!game.teamProgress) { card.classList.add('hidden'); return; }
  const progress = game.teamProgress;
  if (progress.state?.status === 'finished') {
    card.className = 'solution-card team-finished';
    card.innerHTML = `<span class="kicker">Expediente cerrado por vuestro equipo</span><h3>${escapeHtml(game.team?.name || profile?.team?.name || 'Equipo')}</h3><p>Habéis terminado antes del límite de 48 horas. El caso continúa abierto para los demás equipos.</p>`;
  } else {
    card.className = 'solution-card';
    card.innerHTML = `<span class="kicker">Progreso del equipo</span><h3>${progress.completedCount} de ${game.rules.missionCount} misiones completadas</h3><p>Cuando completéis todas, la acusación final se abrirá inmediatamente para vuestro equipo.</p>`;
  }
  card.classList.remove('hidden');
}

function renderGame() {
  const mystery = game.case;
  if (game.team && profile) {
    profile.team = game.team;
    storage.set('mm-profile', profile);
    setProfileUi();
  }
  $('#caseCode').textContent = mystery.code;
  $('#district').textContent = mystery.district;
  $('#caseTitle').textContent = mystery.title;
  $('#caseSynopsis').textContent = mystery.synopsis;
  $('#catalogPill').textContent = `${game.rules.catalogSize.toLocaleString('es-ES')} casos`;
  $('#teamPill').textContent = game.team?.name || profile?.team?.name || `${game.rules.expectedTeamCount} brigadas equilibradas`;
  $('#victim').textContent = mystery.victim;
  $('#crimeScene').textContent = mystery.crimeScene;
  $('#locationDetail').textContent = `Distrito: ${mystery.district}. Acceso restringido durante la franja investigada.`;
  $('#caseDates').textContent = `${dateTime(game.cycle.startsAt)} → ${dateTime(game.cycle.endsAt)}`;
  $('#clueBadge').textContent = `${game.cycle.unlockedCount}/${game.rules.clueCount}`;
  $('#clueCount').textContent = `${game.cycle.unlockedCount} de ${game.rules.clueCount} disponibles`;

  $('#suspectGrid').innerHTML = mystery.suspects.map((suspect, index) => `
    <article class="suspect-card" data-index="0${index + 1}">
      <span class="profession">${escapeHtml(suspect.profession)}</span><h3>${escapeHtml(suspect.name)}</h3><p>${escapeHtml(suspect.relation)}</p>
      <dl><dt>Coartada</dt><dd>${escapeHtml(suspect.alibi)}</dd><dt>Credencial</dt><dd>Termina en ${escapeHtml(suspect.badgeSuffix)}</dd><dt>Seña personal</dt><dd>${escapeHtml(suspect.signature)}</dd></dl>
    </article>`).join('');

  $('#clueTimeline').innerHTML = mystery.clues.map(clue => `
    <article class="clue ${clue.unlocked ? 'unlocked' : 'locked'}">
      <span class="clue-number">${pad(clue.number)}</span>
      <div><h3>${escapeHtml(clue.title)}</h3><p>${clue.unlocked ? escapeHtml(clue.content) : 'Contenido protegido hasta la hora de desbloqueo.'}</p></div>
      <span class="clue-time">${clue.unlocked ? 'Disponible' : dateTime(clue.unlockAt)}</span>
    </article>`).join('');

  if (game.previousSolution) {
    const previous = game.previousSolution;
    $('#previousSolution').innerHTML = `<span class="kicker">Caso anterior · ${escapeHtml(previous.code)}</span><h3>${escapeHtml(previous.title)}</h3><p>${escapeHtml(previous.solution)}</p>`;
    $('#previousSolution').classList.remove('hidden');
  }
  fillSelect('#accusedSuspect', mystery.suspects, 'id', 'name');
  fillSelect('#accusedMotive', mystery.choices.motives);
  fillSelect('#accusedMethod', mystery.choices.methods);
  fillSelect('#accusedLocation', mystery.choices.locations);
  renderMissions();
  renderTeamStatus();
  updateAccusationState();
  updateTimers();
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = setInterval(updateTimers, 1000);
}

function updateTimers() {
  if (!game) return;
  const current = now();
  const start = new Date(game.cycle.startsAt).getTime();
  const end = new Date(game.cycle.endsAt).getTime();
  const remaining = end - current;
  $('#caseTimer').textContent = duration(remaining);
  $('#caseProgress').style.width = `${Math.min(1, Math.max(0, (current - start) / (end - start))) * 100}%`;
  if (game.cycle.nextClueAt) {
    const next = new Date(game.cycle.nextClueAt).getTime() - current;
    $('#nextClueTimer').textContent = next > 0 ? shortDuration(next) : 'Ya disponible';
    $('#nextClueText').textContent = `La siguiente pista se publica a las ${dateTime(game.cycle.nextClueAt)}.`;
    if (next <= 0) refreshGameSilently();
  } else {
    $('#nextClueTimer').textContent = 'Todas publicadas';
    $('#nextClueText').textContent = 'Ya tienes la cadena completa de pistas.';
  }
  if (remaining <= 0) refreshGameSilently();
}

function normalizePersistentResult(result) {
  if (!result) return null;
  if (result.checks) return result;
  return {
    total:result.totalScore,
    missionScore:result.missionScore,
    base:result.accusationScore,
    speedBonus:result.speedBonus,
    isCorrect:Boolean(result.solvedCorrectly),
    checks:{ suspect:Boolean(result.suspectCorrect), motive:Boolean(result.motiveCorrect), method:Boolean(result.methodCorrect), location:Boolean(result.locationCorrect) }
  };
}

function updateAccusationState() {
  const progress = game.teamProgress;
  const finished = progress?.state?.status === 'finished';
  const open = Boolean(progress?.allMissionsCompleted && !finished);
  $('#accusationLocked').classList.toggle('hidden', open || finished);
  $('#accusationForm').classList.toggle('hidden', !open);
  $('#accusationTimer').textContent = profile ? `${progress?.completedCount || 0} de ${game.rules.missionCount} misiones completadas` : 'Registra tu alias para jugar en equipo';
  if (finished && progress.result && game.teamSolution) renderResult({ result:normalizePersistentResult(progress.result), solution:game.teamSolution });
  else $('#accusationResult').classList.add('hidden');
}

function renderResult(data) {
  const result = data.result;
  const answer = data.solution.answer;
  const card = $('#accusationResult');
  card.innerHTML = `
    <span class="kicker">Expediente cerrado por el equipo</span><div class="score">${result.total} pts</div>
    <h3>${result.isCorrect ? 'Caso resuelto correctamente' : 'Acusación registrada'}</h3>
    <ul><li>Misiones: ${result.missionScore || 0} puntos</li><li>Persona: ${result.checks.suspect ? 'correcta' : 'incorrecta'}</li><li>Motivo: ${result.checks.motive ? 'correcto' : 'incorrecto'}</li><li>Método: ${result.checks.method ? 'correcto' : 'incorrecto'}</li><li>Lugar: ${result.checks.location ? 'correcto' : 'incorrecto'}</li><li>Bonificación por rapidez: ${result.speedBonus || 0}</li></ul>
    <p><b>Solución:</b> ${escapeHtml(data.solution.explanation)}</p><p><b>Responsable:</b> ${escapeHtml(answer.suspectName)}</p>`;
  card.classList.remove('hidden');
}

async function loadRanking() {
  const rows = $('#rankingRows');
  rows.innerHTML = '<div class="empty-row">Actualizando…</div>';
  try {
    const data = await api('/api/ranking');
    $('#rankingMode').textContent = `${data.finishedTeams} de ${data.activeTeams} equipos han terminado. El caso permanece abierto para los demás hasta ${dateTime(data.caseEndsAt)}.`;
    rows.innerHTML = data.ranking.length ? data.ranking.map((entry, index) => `
      <div class="ranking-row"><span>${index + 1}</span><span>${escapeHtml(entry.teamName)}</span><span>${entry.status === 'finished' ? 'Terminado' : 'Investigando'} · ${entry.memberCount}</span><span class="points">${entry.totalScore ?? '—'}</span></div>`).join('') : '<div class="empty-row">Todavía no hay equipos activos.</div>';
  } catch (error) { rows.innerHTML = `<div class="empty-row">${escapeHtml(error.message)}</div>`; }
}

async function loadGame() {
  $('#loadingView').classList.remove('hidden');
  $('#errorView').classList.add('hidden');
  $('#gameView').classList.add('hidden');
  try {
    game = await api('/api/game');
    serverOffset = new Date(game.serverNow).getTime() - Date.now();
    renderGame();
    $('#loadingView').classList.add('hidden');
    $('#gameView').classList.remove('hidden');
    if (!profile) setTimeout(() => $('#profileDialog').showModal(), 350);
  } catch (error) {
    $('#loadingView').classList.add('hidden');
    $('#errorMessage').textContent = error.message;
    $('#errorView').classList.remove('hidden');
  }
}

async function refreshGameSilently(force = false) {
  if (refreshing) return;
  refreshing = true;
  try {
    const next = await api('/api/game');
    if (force || !game || next.cycle.number !== game.cycle.number || next.cycle.unlockedCount !== game.cycle.unlockedCount || JSON.stringify(next.teamProgress) !== JSON.stringify(game.teamProgress)) {
      game = next;
      serverOffset = new Date(game.serverNow).getTime() - Date.now();
      renderGame();
      if (!force) toast('El expediente se ha actualizado.');
    }
  } finally { refreshing = false; }
}

$$('.tab').forEach(button => button.addEventListener('click', () => {
  $$('.tab').forEach(item => item.classList.toggle('active', item === button));
  $$('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === button.dataset.tab));
  if (button.dataset.tab === 'ranking') loadRanking();
}));

$('#missionList').addEventListener('submit', async event => {
  const form = event.target.closest('.mission-form');
  if (!form) return;
  event.preventDefault();
  if (!profile) { $('#profileDialog').showModal(); return; }
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const data = await api(`/api/missions/${encodeURIComponent(form.dataset.missionId)}/submit`, { method:'POST', body:JSON.stringify({ answer:form.querySelector('select').value }) });
    game.teamProgress = data.progress;
    renderMissions();
    renderTeamStatus();
    updateAccusationState();
    toast(data.message || 'Progreso guardado.');
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; }
});

$('#profileButton').addEventListener('click', () => { setProfileUi(); $('#profileDialog').showModal(); });
$('#closeProfile').addEventListener('click', () => $('#profileDialog').close());
$('#retryButton').addEventListener('click', loadGame);
$('#refreshRanking').addEventListener('click', loadRanking);

$('#profileForm').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  try {
    const data = await api('/api/players', { method:'POST', body:JSON.stringify({ alias:$('#aliasInput').value.trim(), assignmentCode:$('#assignmentCodeInput').value.trim() }) });
    profile = { ...data.player, team:data.team || null, localMode:false };
    storage.set('mm-profile', profile);
    setProfileUi();
    $('#profileDialog').close();
    await refreshGameSilently(true);
    toast(`Bienvenida/o a ${profile.team?.name || 'tu equipo'}.`);
  } catch (error) { $('#profileNote').textContent = error.message; }
  finally { button.disabled = false; }
});

$('#accusationForm').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  button.textContent = 'Cerrando expediente…';
  try {
    const data = await api('/api/accusations', { method:'POST', body:JSON.stringify({ suspectId:$('#accusedSuspect').value, motive:$('#accusedMotive').value, method:$('#accusedMethod').value, location:$('#accusedLocation').value }) });
    renderResult(data);
    toast(data.message);
    await refreshGameSilently(true);
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.textContent = 'Registrar acusación'; }
});

setProfileUi();
loadGame();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
