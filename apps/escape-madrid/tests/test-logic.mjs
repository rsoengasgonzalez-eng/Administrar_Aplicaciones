import fs from 'node:fs';
import vm from 'node:vm';

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(new URL('../core.js', import.meta.url), 'utf8'), sandbox);
const rooms = sandbox.window.ESCAPE_ROOMS;
const { priceFor, filterAndSort } = sandbox.window.EscapeMadridCore;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const casino = rooms.find(r => r.id === 'college-casino');
const casino4 = priceFor(casino, 4);
assert(casino4.exact && casino4.total === 75 && casino4.pp === 18.75, 'Precio exacto de Casino para 4 incorrecto');

const atraco = rooms.find(r => r.id === 'incognito-atraco');
const atraco12 = priceFor(atraco, 12);
assert(atraco12.total === 240 && atraco12.pp === 20, 'Precio por persona de El Atraco incorrecto');

const monster = rooms.find(r => r.id === 'incognito-monster');
const monster5 = priceFor(monster, 5);
assert(!monster5.exact && Math.abs(monster5.total - 150) < 0.001, 'Interpolación del rango incorrecta');

const filters = { players: 8, theme: 'Terror', budget: 30, query: '', includeUnknown: true, sort: 'price-asc' };
const terror8 = filterAndSort(rooms, filters);
assert(terror8.length > 0, 'El filtro de terror para 8 no devuelve resultados');
assert(terror8.every(x => x.room.minPlayers <= 8 && x.room.maxPlayers >= 8), 'Se devolvió una sala incompatible con 8 personas');
assert(terror8.every(x => x.room.themes.includes('Terror')), 'Se devolvió una sala que no es de terror');
assert(terror8.every(x => x.price.known && x.price.pp <= 30), 'Se devolvió un precio superior al presupuesto o desconocido');
for (let i = 1; i < terror8.length; i++) assert(terror8[i - 1].price.pp <= terror8[i].price.pp, 'Orden de precio incorrecto');

const unknownExcluded = filterAndSort(rooms, { players: 4, theme: '', budget: null, query: '', includeUnknown: false, sort: 'recommended' });
assert(unknownExcluded.every(x => x.price.known), 'El filtro de precio conocido no funciona');

const chamberi = filterAndSort(rooms, { players: 4, theme: '', budget: null, query: 'chamberí', includeUnknown: true, sort: 'name-asc' });
assert(chamberi.length >= 5, 'La búsqueda por zona no devuelve resultados suficientes');
assert(chamberi.every(x => [x.room.name, x.room.company, x.room.area, x.room.address, x.room.note, ...x.room.themes].join(' ').toLocaleLowerCase('es').includes('chamberí')), 'La búsqueda textual devolvió un falso positivo');

console.log(`OK: lógica de precios, filtros, búsqueda y orden validada (${terror8.length} opciones en escenario terror/8/30 €).`);
