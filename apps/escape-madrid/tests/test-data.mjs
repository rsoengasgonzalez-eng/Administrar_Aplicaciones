import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const rooms = sandbox.window.ESCAPE_ROOMS;

const errors = [];
const ids = new Set();
const validPriceTypes = new Set(['range', 'table', 'perPerson', 'fromPerPerson', 'unknown']);

if (!Array.isArray(rooms) || rooms.length === 0) errors.push('El catálogo está vacío.');

for (const room of rooms) {
  if (!room.id || ids.has(room.id)) errors.push(`ID inválido o duplicado: ${room.id}`);
  ids.add(room.id);
  for (const field of ['name', 'company', 'area', 'address', 'officialUrl', 'sourceUrl']) {
    if (!room[field]) errors.push(`${room.id}: falta ${field}`);
  }
  if (!Array.isArray(room.themes) || room.themes.length === 0) errors.push(`${room.id}: sin temáticas`);
  if (!Number.isInteger(room.minPlayers) || !Number.isInteger(room.maxPlayers) || room.minPlayers > room.maxPlayers) {
    errors.push(`${room.id}: rango de jugadores inválido`);
  }
  if (!Number.isFinite(room.duration) || room.duration <= 0) errors.push(`${room.id}: duración inválida`);
  if (!room.pricing || !validPriceTypes.has(room.pricing.type)) errors.push(`${room.id}: modelo de precio inválido`);
  for (const key of ['officialUrl', 'bookingUrl', 'sourceUrl']) {
    if (room[key] && !/^https?:\/\//.test(room[key])) errors.push(`${room.id}: URL inválida en ${key}`);
  }
  if (room.pricing?.type === 'range' && !(room.pricing.minTotal > 0 && room.pricing.maxTotal >= room.pricing.minTotal)) {
    errors.push(`${room.id}: rango de precio inválido`);
  }
  if (room.pricing?.type === 'table') {
    for (let n = room.minPlayers; n <= room.maxPlayers; n += 1) {
      if (!Number.isFinite(room.pricing.values[n])) errors.push(`${room.id}: falta precio exacto para ${n} jugadores`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const companies = new Set(rooms.map(r => r.company));
const themes = new Set(rooms.flatMap(r => r.themes));
console.log(`OK: ${rooms.length} experiencias, ${companies.size} empresas, ${themes.size} temáticas; IDs y URLs validados.`);
