import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => readFileSync(join(root, path), "utf8");

for (const path of [
  "public/index.html",
  "public/app.js",
  "public/styles.css",
  "public/sw.js",
  "public/manifest.webmanifest",
  "public/assets",
  "public/apps",
  "src/worker.js",
  "tests/integration.mjs",
  "package.json",
  "wrangler.jsonc",
  "README.md",
]) {
  assert.ok(existsSync(join(root, path)), `Falta ${path}`);
}

for (const duplicate of [
  "index.html",
  "app.js",
  "styles.css",
  "sw.js",
  "manifest.webmanifest",
  "assets",
  "apps",
]) {
  assert.equal(existsSync(join(root, duplicate)), false, `${duplicate} no debe estar en la raíz`);
}

const config = JSON.parse(read("wrangler.jsonc"));
assert.equal(config.main, "./src/worker.js");
assert.equal(config.assets.directory, "./public");
assert.equal(config.assets.binding, "ASSETS");
assert.deepEqual(config.assets.run_worker_first, ["/api/*"]);
assert.deepEqual(config.durable_objects.bindings, [
  { name: "PLANES_STORE", class_name: "PlansStore" },
]);
assert.deepEqual(config.migrations, [
  { tag: "v1", new_sqlite_classes: ["PlansStore"] },
]);
assert.deepEqual(config.services, [
  { binding: "MADRID_MYSTERY", service: "juego" },
  { binding: "MUSIC_HUB", service: "musichub" },
]);

const worker = read("src/worker.js");
for (const damaged of ["&gt;", "&lt;", "=&gt;", "<a ", "</a>", "REEMPLAZAR", "database_id"]) {
  assert.equal(worker.includes(damaged), false, `Worker dañado: ${damaged}`);
}
for (const expected of [
  "https://nexus-cache.invalid/",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://www.openstreetmap.org/",
]) {
  assert.ok(worker.includes(expected), `Falta URL válida: ${expected}`);
}

const portal = read("public/app.js");
assert.equal((portal.match(/href:'apps\//g) || []).length, 5);
for (const expected of [
  "link.target='_blank'",
  "target=\"_blank\"",
  "window.open(app.href,'_blank'",
  "noopener noreferrer",
]) {
  assert.ok(portal.includes(expected), `Falta navegación segura: ${expected}`);
}

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

for (const file of walk(join(root, "public")).filter((path) => path.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  const references = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map((match) => match[1]);
  for (const reference of references) {
    if (!reference || /^(?:https?:|data:|#|mailto:|tel:|\/api\/)/.test(reference)) continue;
    const clean = reference.split(/[?#]/)[0];
    assert.ok(existsSync(resolve(file, "..", clean)), `${file}: falta ${reference}`);
  }
}

console.log("Package structure, Wrangler bindings, Worker source and static references passed");
