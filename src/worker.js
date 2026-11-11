const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

function clean(value, maxLength = 200) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function now() {
  return new Date().toISOString();
}

function rows(cursor) {
  return [...cursor];
}

class RequestError extends Error {
  constructor(message, status = 400, code = "REQUEST_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class PlansStore {
  constructor(state) {
    this.state = state;
    this.sql = state.storage.sql;

    state.blockConcurrencyWhile(async () => {
      this.sql.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          client_token TEXT NOT NULL UNIQUE,
          alias TEXT NOT NULL,
          zone TEXT NOT NULL DEFAULT '',
          interests_json TEXT NOT NULL DEFAULT '[]',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          owner_id TEXT NOT NULL,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          starts_at TEXT NOT NULL,
          location TEXT NOT NULL,
          address TEXT NOT NULL DEFAULT '',
          capacity INTEGER NOT NULL DEFAULT 20,
          price TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          image_url TEXT NOT NULL DEFAULT '',
          allow_waitlist INTEGER NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'published',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS attendees (
          plan_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          status TEXT NOT NULL,
          joined_at TEXT NOT NULL,
          PRIMARY KEY (plan_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plan_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS polls (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question TEXT NOT NULL,
          closes_at TEXT,
          status TEXT NOT NULL DEFAULT 'open',
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS poll_options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          poll_id INTEGER NOT NULL,
          label TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS poll_votes (
          poll_id INTEGER NOT NULL,
          option_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          PRIMARY KEY (poll_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_plans_starts
          ON plans(status, starts_at);
        CREATE INDEX IF NOT EXISTS idx_attendees_plan
          ON attendees(plan_id, status, joined_at);
        CREATE INDEX IF NOT EXISTS idx_comments_plan
          ON comments(plan_id, created_at);
      `);
    });
  }

  async readPayload(request) {
    try {
      return await request.json();
    } catch {
      throw new RequestError("El cuerpo JSON no es válido.", 400, "INVALID_JSON");
    }
  }

  getUser(request) {
    const clientToken = clean(request.headers.get("x-client-id"), 100);
    if (!clientToken) {
      throw new RequestError(
        "Falta el identificador privado del navegador.",
        401,
        "CLIENT_REQUIRED",
      );
    }

    let user = rows(
      this.sql.exec(
        "SELECT id, alias, zone, interests_json FROM users WHERE client_token = ?",
        clientToken,
      ),
    )[0];

    if (!user) {
      const id = crypto.randomUUID();
      const timestamp = now();
      const suffix = clientToken.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase();
      const alias = `Invitado-${suffix || "NUEVO"}`;

      this.sql.exec(
        `INSERT INTO users
          (id, client_token, alias, zone, interests_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        clientToken,
        alias,
        "",
        "[]",
        timestamp,
        timestamp,
      );

      user = { id, alias, zone: "", interests_json: "[]" };
    }

    return {
      ...user,
      interests: JSON.parse(user.interests_json || "[]"),
    };
  }

  getBootstrap(user) {
    const plans = rows(
      this.sql.exec(`
        SELECT p.*, u.alias AS owner_alias
        FROM plans p
        JOIN users u ON u.id = p.owner_id
        WHERE p.status = 'published'
        ORDER BY p.starts_at
      `),
    ).map((plan) => {
      const attendance = rows(
        this.sql.exec(
          `SELECT u.alias, a.status
           FROM attendees a
           JOIN users u ON u.id = a.user_id
           WHERE a.plan_id = ?
           ORDER BY a.joined_at`,
          plan.id,
        ),
      );

      const comments = rows(
        this.sql.exec(
          `SELECT u.alias AS name, c.body AS text, c.created_at
           FROM comments c
           JOIN users u ON u.id = c.user_id
           WHERE c.plan_id = ?
           ORDER BY c.created_at`,
          plan.id,
        ),
      );

      return {
        id: plan.id,
        title: plan.title,
        category: plan.category,
        date: plan.starts_at.slice(0, 10),
        time: plan.starts_at.slice(11, 16),
        location: plan.location,
        address: plan.address,
        capacity: Number(plan.capacity),
        price: plan.price,
        description: plan.description,
        image: plan.image_url,
        allowWaitlist: Boolean(plan.allow_waitlist),
        createdBy: plan.owner_alias,
        isOwner: plan.owner_id === user.id,
        featured: false,
        attendees: attendance
          .filter((item) => item.status === "confirmed")
          .map((item) => item.alias),
        waitlist: attendance
          .filter((item) => item.status === "waiting")
          .map((item) => item.alias),
        comments: comments.map((comment) => ({
          name: comment.name,
          text: comment.text,
          time: new Intl.DateTimeFormat("es-ES", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Europe/Madrid",
          }).format(new Date(comment.created_at)),
        })),
      };
    });

    const polls = rows(
      this.sql.exec("SELECT * FROM polls WHERE status = 'open' ORDER BY created_at DESC"),
    ).map((poll) => {
      const options = rows(
        this.sql.exec(
          `SELECT o.id, o.label, COUNT(v.option_id) AS votes
           FROM poll_options o
           LEFT JOIN poll_votes v ON v.option_id = o.id
           WHERE o.poll_id = ?
           GROUP BY o.id, o.label
           ORDER BY o.id`,
          poll.id,
        ),
      );

      const currentVote = rows(
        this.sql.exec(
          "SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_id = ?",
          poll.id,
          user.id,
        ),
      )[0];

      return {
        id: poll.id,
        question: poll.question,
        closes: poll.closes_at
          ? `Cierra ${new Intl.DateTimeFormat("es-ES", {
              dateStyle: "medium",
              timeZone: "Europe/Madrid",
            }).format(new Date(poll.closes_at))}`
          : "Sin fecha de cierre",
        options: options.map((option) => ({
          id: option.id,
          label: option.label,
          votes: Number(option.votes),
        })),
        voted: currentVote
          ? options.findIndex((option) => option.id === currentVote.option_id)
          : null,
      };
    });

    return {
      profile: {
        name: user.alias,
        zone: user.zone,
        interests: user.interests,
      },
      plans,
      polls,
      serverTime: now(),
    };
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    try {
      if (method === "GET" && path === "/api/planes/health") {
        return json({
          ok: true,
          service: "planes-con-alma",
          database: "durable-object-sqlite",
        });
      }

      const user = this.getUser(request);

      if (method === "GET" && path === "/api/planes/bootstrap") {
        return json(this.getBootstrap(user));
      }

      if (method === "PUT" && path === "/api/planes/profile") {
        const payload = await this.readPayload(request);
        const alias = clean(payload.name, 30);
        if (alias.length < 2) {
          throw new RequestError("El alias debe tener al menos dos caracteres.");
        }

        const interests = Array.isArray(payload.interests)
          ? payload.interests.map((item) => clean(item, 30)).slice(0, 10)
          : [];

        this.sql.exec(
          `UPDATE users
           SET alias = ?, zone = ?, interests_json = ?, updated_at = ?
           WHERE id = ?`,
          alias,
          clean(payload.zone, 80),
          JSON.stringify(interests),
          now(),
          user.id,
        );
        return json({ ok: true });
      }

      if (method === "POST" && path === "/api/planes/plans") {
        const payload = await this.readPayload(request);
        const title = clean(payload.title, 90);
        const startsAt = clean(payload.startsAt, 30);

        if (!title || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(startsAt)) {
          throw new RequestError("Título, fecha y hora son obligatorios.");
        }

        const timestamp = now();
        this.sql.exec(
          `INSERT INTO plans
            (owner_id, title, category, starts_at, location, address, capacity,
             price, description, image_url, allow_waitlist, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`,
          user.id,
          title,
          clean(payload.category, 40) || "Actividad",
          startsAt,
          clean(payload.location, 100),
          clean(payload.address, 180),
          Math.max(2, Math.min(100, Number(payload.capacity) || 20)),
          clean(payload.price, 40),
          clean(payload.description, 1000),
          clean(payload.image, 500),
          payload.allowWaitlist === false ? 0 : 1,
          timestamp,
          timestamp,
        );

        const id = rows(this.sql.exec("SELECT last_insert_rowid() AS id"))[0].id;
        this.sql.exec(
          `INSERT INTO attendees (plan_id, user_id, status, joined_at)
           VALUES (?, ?, 'confirmed', ?)`,
          id,
          user.id,
          timestamp,
        );
        return json({ id }, 201);
      }

      let match = path.match(/^\/api\/planes\/plans\/(\d+)$/);
      if (match && (method === "PATCH" || method === "DELETE")) {
        const planId = Number(match[1]);
        const plan = rows(
          this.sql.exec("SELECT owner_id FROM plans WHERE id = ?", planId),
        )[0];

        if (!plan) throw new RequestError("Plan no encontrado.", 404, "NOT_FOUND");
        if (plan.owner_id !== user.id) {
          throw new RequestError(
            "Solo la persona creadora puede modificar este plan.",
            403,
            "FORBIDDEN",
          );
        }

        if (method === "DELETE") {
          this.sql.exec(
            "UPDATE plans SET status = 'cancelled', updated_at = ? WHERE id = ?",
            now(),
            planId,
          );
          return json({ ok: true });
        }

        const payload = await this.readPayload(request);
        this.sql.exec(
          `UPDATE plans
           SET title = ?, category = ?, starts_at = ?, location = ?, address = ?,
               capacity = ?, price = ?, description = ?, image_url = ?,
               allow_waitlist = ?, updated_at = ?
           WHERE id = ?`,
          clean(payload.title, 90),
          clean(payload.category, 40),
          clean(payload.startsAt, 30),
          clean(payload.location, 100),
          clean(payload.address, 180),
          Math.max(2, Math.min(100, Number(payload.capacity) || 20)),
          clean(payload.price, 40),
          clean(payload.description, 1000),
          clean(payload.image, 500),
          payload.allowWaitlist === false ? 0 : 1,
          now(),
          planId,
        );
        return json({ ok: true });
      }

      match = path.match(/^\/api\/planes\/plans\/(\d+)\/rsvp$/);
      if (match && method === "POST") {
        const planId = Number(match[1]);
        const plan = rows(
          this.sql.exec(
            "SELECT capacity, allow_waitlist FROM plans WHERE id = ? AND status = 'published'",
            planId,
          ),
        )[0];

        if (!plan) throw new RequestError("Plan no encontrado.", 404, "NOT_FOUND");

        const existing = rows(
          this.sql.exec(
            "SELECT status FROM attendees WHERE plan_id = ? AND user_id = ?",
            planId,
            user.id,
          ),
        )[0];

        if (existing) {
          this.sql.exec(
            "DELETE FROM attendees WHERE plan_id = ? AND user_id = ?",
            planId,
            user.id,
          );

          if (existing.status === "confirmed") {
            const next = rows(
              this.sql.exec(
                `SELECT user_id FROM attendees
                 WHERE plan_id = ? AND status = 'waiting'
                 ORDER BY joined_at LIMIT 1`,
                planId,
              ),
            )[0];
            if (next) {
              this.sql.exec(
                `UPDATE attendees SET status = 'confirmed'
                 WHERE plan_id = ? AND user_id = ?`,
                planId,
                next.user_id,
              );
            }
          }
          return json({ status: "removed" });
        }

        const count = Number(
          rows(
            this.sql.exec(
              `SELECT COUNT(*) AS count FROM attendees
               WHERE plan_id = ? AND status = 'confirmed'`,
              planId,
            ),
          )[0].count,
        );

        const status =
          count < Number(plan.capacity)
            ? "confirmed"
            : plan.allow_waitlist
              ? "waiting"
              : null;

        if (!status) {
          throw new RequestError(
            "El plan está completo y no admite lista de espera.",
            409,
            "FULL",
          );
        }

        this.sql.exec(
          `INSERT INTO attendees (plan_id, user_id, status, joined_at)
           VALUES (?, ?, ?, ?)`,
          planId,
          user.id,
          status,
          now(),
        );
        return json({ status });
      }

      match = path.match(/^\/api\/planes\/plans\/(\d+)\/comments$/);
      if (match && method === "POST") {
        const payload = await this.readPayload(request);
        const text = clean(payload.text, 220);
        if (!text) throw new RequestError("El comentario está vacío.");

        this.sql.exec(
          `INSERT INTO comments (plan_id, user_id, body, created_at)
           VALUES (?, ?, ?, ?)`,
          Number(match[1]),
          user.id,
          text,
          now(),
        );
        return json({ ok: true }, 201);
      }

      match = path.match(/^\/api\/planes\/polls\/(\d+)\/vote$/);
      if (match && method === "POST") {
        const payload = await this.readPayload(request);
        const pollId = Number(match[1]);
        const optionId = Number(payload.optionId);
        const validOption = rows(
          this.sql.exec(
            "SELECT id FROM poll_options WHERE id = ? AND poll_id = ?",
            optionId,
            pollId,
          ),
        )[0];

        if (!validOption) throw new RequestError("Opción de votación no válida.");

        this.sql.exec(
          `INSERT INTO poll_votes (poll_id, option_id, user_id, created_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (poll_id, user_id)
           DO UPDATE SET option_id = excluded.option_id, created_at = excluded.created_at`,
          pollId,
          optionId,
          user.id,
          now(),
        );
        return json({ ok: true });
      }

      return json({ error: "Ruta no encontrada.", code: "NOT_FOUND" }, 404);
    } catch (error) {
      return json(
        {
          error: error.message || "Error interno",
          code: error.code || "INTERNAL_ERROR",
        },
        error.status || 500,
      );
    }
  }
}

function addressOf(tags) {
  return (
    [
      tags["addr:street"],
      tags["addr:housenumber"],
      tags["addr:postcode"],
      tags["addr:city"],
    ]
      .filter(Boolean)
      .join(" ") ||
    tags["addr:full"] ||
    tags["contact:address"] ||
    "Dirección no publicada"
  );
}

function centerOf(element) {
  return {
    lat: Number(element.lat ?? element.center?.lat),
    lng: Number(element.lon ?? element.center?.lon),
  };
}

async function queryOverpass(query, cacheKeyName) {
  const cache = caches.default;
  const cacheKey = new Request(`https://nexus-cache.invalid/${cacheKeyName}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached.json();

  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  let lastError;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "user-agent": "NexusMadrid/3.0",
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(24_000),
      });

      if (!response.ok) throw new Error(`Overpass respondió ${response.status}`);

      const data = await response.json();
      const cacheResponse = json(data, 200, {
        "cache-control": "public, max-age=21600",
      });
      await cache.put(cacheKey, cacheResponse.clone());
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `No se pudo consultar OpenStreetMap: ${lastError?.message || "error de red"}`,
  );
}

async function mesaApi() {
  const query = `[out:json][timeout:22];
    (nwr["amenity"="restaurant"](40.25,-3.90,40.60,-3.45););
    out center tags;`;
  const data = await queryOverpass(query, "mesa-restaurants-v4");

  const items = (data.elements || [])
    .map((element) => {
      const tags = element.tags || {};
      const center = centerOf(element);
      return {
        id: `osm-${element.type}-${element.id}`,
        name: tags.name,
        lat: center.lat,
        lng: center.lng,
        address: addressOf(tags),
        area:
          tags["addr:suburb"] ||
          tags["addr:neighbourhood"] ||
          tags["addr:city"] ||
          "Madrid",
        zone: tags["addr:district"] || tags["addr:suburb"] || "Madrid",
        cuisine: (tags.cuisine || "Restaurante")
          .split(";")
          .map((value) => value.replaceAll("_", " "))
          .join(", "),
        openingHours: tags.opening_hours || "",
        phone: tags["contact:phone"] || tags.phone || "",
        website: tags["contact:website"] || tags.website || "",
        diet:
          (tags["diet:vegetarian"] === "yes" ? "Vegetariano;" : "") +
          (tags["diet:vegan"] === "yes" ? "Vegano;" : "") +
          (tags["diet:gluten_free"] === "yes" ? "Sin gluten;" : ""),
      };
    })
    .filter(
      (item) =>
        item.name && Number.isFinite(item.lat) && Number.isFinite(item.lng),
    );

  return json(
    {
      items,
      source: "OpenStreetMap / Overpass",
      license: "ODbL",
      updatedAt: now(),
    },
    200,
    { "cache-control": "public, max-age=3600" },
  );
}

async function escapeApi() {
  const query = `[out:json][timeout:22];
    (
      nwr["leisure"="escape_game"](40.20,-4.10,40.70,-3.30);
      nwr["attraction"="escape_room"](40.20,-4.10,40.70,-3.30);
    );
    out center tags;`;
  const data = await queryOverpass(query, "escape-rooms-v4");

  const items = (data.elements || [])
    .map((element) => {
      const tags = element.tags || {};
      const center = centerOf(element);
      return {
        id: `osm-${element.type}-${element.id}`,
        name: tags.name,
        company: tags.operator || tags.brand || tags.name,
        lat: center.lat,
        lng: center.lng,
        address: addressOf(tags),
        area: tags["addr:suburb"] || tags["addr:city"] || "Madrid",
        website: tags["contact:website"] || tags.website || "",
        phone: tags["contact:phone"] || tags.phone || "",
        openingHours: tags.opening_hours || "",
        description: tags.description || "",
        sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      };
    })
    .filter(
      (item) =>
        item.name && Number.isFinite(item.lat) && Number.isFinite(item.lng),
    );

  return json(
    {
      items,
      source: "OpenStreetMap / Overpass",
      license: "ODbL",
      updatedAt: now(),
    },
    200,
    { "cache-control": "public, max-age=3600" },
  );
}

function proxiedApiPath(pathname, prefix) {
  const suffix = pathname.slice(prefix.length);
  return suffix.startsWith("/api/") ? suffix : `/api${suffix}`;
}

async function proxyService(request, binding, url, prefix, label) {
  if (!binding) {
    return json(
      {
        error: `${label} no está enlazado. Revisa el service binding en wrangler.jsonc.`,
        code: "SERVICE_NOT_CONFIGURED",
      },
      503,
    );
  }

  const target = new URL(request.url);
  target.pathname = proxiedApiPath(url.pathname, prefix);
  return binding.fetch(new Request(target, request));
}

function secure(response) {
  const secured = new Response(response.body, response);
  secured.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  secured.headers.set("x-content-type-options", "nosniff");
  return secured;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/api/madrid-mystery/")) {
        return secure(
          await proxyService(
            request,
            env.MADRID_MYSTERY,
            url,
            "/api/madrid-mystery",
            "Madrid Mystery",
          ),
        );
      }

      if (url.pathname.startsWith("/api/music-hub/")) {
        return secure(
          await proxyService(
            request,
            env.MUSIC_HUB,
            url,
            "/api/music-hub",
            "MusicHub",
          ),
        );
      }

      if (url.pathname.startsWith("/api/planes/")) {
        if (!env.PLANES_STORE) {
          return json(
            {
              error: "El binding PLANES_STORE no está configurado.",
              code: "STORE_NOT_CONFIGURED",
            },
            503,
          );
        }

        const id = env.PLANES_STORE.idFromName("global");
        return secure(await env.PLANES_STORE.get(id).fetch(request));
      }

      if (request.method === "GET" && url.pathname === "/api/mesa/restaurants") {
        return secure(await mesaApi());
      }

      if (request.method === "GET" && url.pathname === "/api/escape/rooms") {
        return secure(await escapeApi());
      }

      if (request.method === "GET" && url.pathname === "/api/health") {
        return json({
          ok: true,
          portal: "ready",
          assets: Boolean(env.ASSETS),
          planesStore: Boolean(env.PLANES_STORE),
          madridMysteryService: Boolean(env.MADRID_MYSTERY),
          musicHubService: Boolean(env.MUSIC_HUB),
          liveData: ["mesa-madrid", "escape-madrid"],
        });
      }

      if (url.pathname.startsWith("/api/")) {
        return json({ error: "Ruta API no encontrada.", code: "NOT_FOUND" }, 404);
      }

      if (!env.ASSETS) {
        return new Response("El binding ASSETS no está configurado.", { status: 503 });
      }

      return secure(await env.ASSETS.fetch(request));
    } catch (error) {
      console.error("Unhandled portal error", error);
      return secure(
        json(
          {
            error: error.message || "Error interno",
            code: error.code || "INTERNAL_ERROR",
          },
          error.status || 500,
        ),
      );
    }
  },
};
