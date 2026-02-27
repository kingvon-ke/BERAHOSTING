import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { createClient } from "redis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connections
const postgresUrl = process.env.DATABASE_URL || "postgresql://postgres:zMVUWRzlrIBUOxhdCdRFoQMrmsnMymzz@postgres.railway.internal:5432/railway";
const redisUrl = process.env.REDIS_URL || "redis://default:lfMLtGJUualUPdAZoCKpWdzKBcSHPiRs@shuttle.proxy.rlwy.net:15137";

// PostgreSQL setup
const { Pool } = pg;
const pgPool = new Pool({
  connectionString: postgresUrl,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Redis setup
const redisClient = createClient({
  url: redisUrl
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis connected'));

// Initialize all connections
async function initializeConnections() {
  await redisClient.connect();
  await initializeDatabase();
}

// Initialize PostgreSQL Tables
async function initializeDatabase() {
  const client = await pgPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS apps (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE,
        region TEXT,
        status TEXT DEFAULT 'idle',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS config_vars (
        id SERIAL PRIMARY KEY,
        app_id TEXT REFERENCES apps(id) ON DELETE CASCADE,
        key TEXT,
        value TEXT,
        UNIQUE(app_id, key)
      );

      CREATE TABLE IF NOT EXISTS releases (
        id SERIAL PRIMARY KEY,
        app_id TEXT REFERENCES apps(id) ON DELETE CASCADE,
        version INTEGER,
        description TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS addons (
        id TEXT PRIMARY KEY,
        app_id TEXT REFERENCES apps(id) ON DELETE CASCADE,
        name TEXT,
        plan TEXT,
        status TEXT
      );

      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        app_id TEXT REFERENCES apps(id) ON DELETE CASCADE,
        source TEXT,
        content TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity (
        id SERIAL PRIMARY KEY,
        app_id TEXT REFERENCES apps(id) ON DELETE CASCADE,
        actor TEXT,
        action TEXT,
        description TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS addons_catalog (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        category TEXT,
        icon TEXT
      );
    `);

    // Seed catalog if empty
    const catalogCount = await client.query("SELECT COUNT(*) as count FROM addons_catalog");
    if (parseInt(catalogCount.rows[0].count) === 0) {
      await client.query(
        "INSERT INTO addons_catalog (id, name, description, category, icon) VALUES ($1, $2, $3, $4, $5)",
        ["bera-postgresql", "Bera Postgres", "Reliable SQL database", "Data Store", "database"]
      );
      await client.query(
        "INSERT INTO addons_catalog (id, name, description, category, icon) VALUES ($1, $2, $3, $4, $5)",
        ["bera-redis", "Bera Redis", "In-memory data structure store", "Caching", "zap"]
      );
      await client.query(
        "INSERT INTO addons_catalog (id, name, description, category, icon) VALUES ($1, $2, $3, $4, $5)",
        ["log-drain", "Log Drain", "External logging integration", "Logging", "terminal"]
      );
      console.log("Catalog seeded");
    }

    // Seed demo app if empty
    const appCount = await client.query("SELECT COUNT(*) as count FROM apps");
    if (parseInt(appCount.rows[0].count) === 0) {
      const id = "demo-app";
      await client.query(
        "INSERT INTO apps (id, name, region, status) VALUES ($1, $2, $3, $4)",
        [id, "bera-demo-app", "us", "running"]
      );
      await client.query(
        "INSERT INTO config_vars (app_id, key, value) VALUES ($1, $2, $3)",
        [id, "DATABASE_URL", postgresUrl]
      );
      await client.query(
        "INSERT INTO config_vars (app_id, key, value) VALUES ($1, $2, $3)",
        [id, "REDIS_URL", redisUrl]
      );
      await client.query(
        "INSERT INTO releases (app_id, version, description, status) VALUES ($1, $2, $3, $4)",
        [id, 1, "Initial deploy", "succeeded"]
      );
      await client.query(
        "INSERT INTO logs (app_id, source, content) VALUES ($1, $2, $3)",
        [id, "app", "Server started on port 3000"]
      );
      await client.query(
        "INSERT INTO logs (app_id, source, content) VALUES ($1, $2, $3)",
        [id, "app", "Connected to PostgreSQL"]
      );
      await client.query(
        "INSERT INTO logs (app_id, source, content) VALUES ($1, $2, $3)",
        [id, "app", "Connected to Redis"]
      );
      await client.query(
        "INSERT INTO activity (app_id, actor, action, description) VALUES ($1, $2, $3, $4)",
        [id, "kingvon.kenya@gmail.com", "deploy", "Deployed v1"]
      );
      console.log("Demo app seeded");
    }
  } finally {
    client.release();
  }
}

async function startServer() {
  // Initialize connections
  await initializeConnections();

  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // WebSocket handling for real-time logs
  const clients = new Set<WebSocket>();
  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
  });

  const broadcastLog = async (appId: string, source: string, content: string) => {
    const logEntry = { appId, source, content, timestamp: new Date().toISOString() };
    const message = JSON.stringify({ type: "log", data: logEntry });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    
    // Persist log to PostgreSQL
    await pgPool.query(
      "INSERT INTO logs (app_id, source, content) VALUES ($1, $2, $3)",
      [appId, source, content]
    );

    // Also cache recent logs in Redis (last 100 per app)
    const key = `logs:${appId}`;
    await redisClient.lPush(key, JSON.stringify(logEntry));
    await redisClient.lTrim(key, 0, 99);
    await redisClient.expire(key, 3600); // Expire after 1 hour
  };

  const createRelease = async (appId: string, description: string) => {
    const lastRelease = await pgPool.query(
      "SELECT COALESCE(MAX(version), 0) as v FROM releases WHERE app_id = $1",
      [appId]
    );
    const nextVersion = parseInt(lastRelease.rows[0].v) + 1;
    
    await pgPool.query(
      "INSERT INTO releases (app_id, version, description, status) VALUES ($1, $2, $3, $4)",
      [appId, nextVersion, description, 'succeeded']
    );
    
    await pgPool.query(
      "INSERT INTO activity (app_id, actor, action, description) VALUES ($1, $2, $3, $4)",
      [appId, "system", "release", description]
    );

    // Cache the latest release in Redis
    const release = {
      version: nextVersion,
      description,
      status: 'succeeded',
      created_at: new Date().toISOString()
    };
    await redisClient.set(`release:${appId}:latest`, JSON.stringify(release));
    
    return nextVersion;
  };

  // Cache middleware
  const cacheMiddleware = (duration: number) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const key = `cache:${req.originalUrl}`;
      const cached = await redisClient.get(key);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Store original send
      const originalJson = res.json;
      res.json = function(body) {
        redisClient.setEx(key, duration, JSON.stringify(body));
        return originalJson.call(this, body);
      };
      
      next();
    };
  };

  // API Routes with caching where appropriate
  app.get("/api/apps", cacheMiddleware(30), async (req, res) => {
    const result = await pgPool.query("SELECT * FROM apps ORDER BY created_at DESC");
    res.json(result.rows);
  });

  app.post("/api/apps", async (req, res) => {
    const { name, region } = req.body;
    const id = Math.random().toString(36).substring(2, 9);
    try {
      await pgPool.query(
        "INSERT INTO apps (id, name, region) VALUES ($1, $2, $3)",
        [id, name, region]
      );
      const result = await pgPool.query("SELECT * FROM apps WHERE id = $1", [id]);
      
      // Clear cache
      await redisClient.del('cache:/api/apps');
      
      res.json(result.rows[0]);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/apps/:id", cacheMiddleware(60), async (req, res) => {
    const result = await pgPool.query("SELECT * FROM apps WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "App not found" });
    res.json(result.rows[0]);
  });

  app.delete("/api/apps/:id", async (req, res) => {
    await pgPool.query("DELETE FROM apps WHERE id = $1", [req.params.id]);
    
    // Clear related caches
    await redisClient.del('cache:/api/apps');
    await redisClient.del(`cache:/api/apps/${req.params.id}`);
    await redisClient.del(`logs:${req.params.id}`);
    
    res.json({ success: true });
  });

  app.get("/api/apps/:id/config", cacheMiddleware(30), async (req, res) => {
    const result = await pgPool.query("SELECT * FROM config_vars WHERE app_id = $1", [req.params.id]);
    res.json(result.rows);
  });

  app.post("/api/apps/:id/config", async (req, res) => {
    const { key, value } = req.body;
    const appId = req.params.id;
    
    // Upsert config var
    await pgPool.query(
      `INSERT INTO config_vars (app_id, key, value) VALUES ($1, $2, $3)
       ON CONFLICT (app_id, key) DO UPDATE SET value = $3`,
      [appId, key, value]
    );
    
    await createRelease(appId, `Set config var ${key}`);
    
    // Clear cache
    await redisClient.del(`cache:/api/apps/${appId}/config`);
    
    res.json({ success: true });
  });

  app.delete("/api/config/:id", async (req, res) => {
    const configVar = await pgPool.query("SELECT * FROM config_vars WHERE id = $1", [req.params.id]);
    if (configVar.rows.length > 0) {
      await pgPool.query("DELETE FROM config_vars WHERE id = $1", [req.params.id]);
      await createRelease(configVar.rows[0].app_id, `Remove config var ${configVar.rows[0].key}`);
      
      // Clear cache
      await redisClient.del(`cache:/api/apps/${configVar.rows[0].app_id}/config`);
    }
    res.json({ success: true });
  });

  app.get("/api/apps/:id/logs", async (req, res) => {
    // Try to get from Redis cache first
    const cachedLogs = await redisClient.lRange(`logs:${req.params.id}`, 0, -1);
    
    if (cachedLogs.length > 0) {
      const logs = cachedLogs.map(log => JSON.parse(log)).reverse();
      return res.json(logs);
    }
    
    // Fallback to PostgreSQL
    const result = await pgPool.query(
      "SELECT * FROM logs WHERE app_id = $1 ORDER BY timestamp DESC LIMIT 100",
      [req.params.id]
    );
    res.json(result.rows.reverse());
  });

  app.get("/api/addons/catalog", cacheMiddleware(3600), async (req, res) => {
    const result = await pgPool.query("SELECT * FROM addons_catalog");
    res.json(result.rows);
  });

  app.get("/api/apps/:id/addons", cacheMiddleware(30), async (req, res) => {
    const result = await pgPool.query("SELECT * FROM addons WHERE app_id = $1", [req.params.id]);
    res.json(result.rows);
  });

  app.post("/api/apps/:id/addons", async (req, res) => {
    const { addonId, plan } = req.body;
    const appId = req.params.id;
    
    const catalogItem = await pgPool.query("SELECT * FROM addons_catalog WHERE id = $1", [addonId]);
    if (catalogItem.rows.length === 0) return res.status(404).json({ error: "Addon not found" });

    const id = Math.random().toString(36).substring(2, 9);
    await pgPool.query(
      "INSERT INTO addons (id, app_id, name, plan, status) VALUES ($1, $2, $3, $4, $5)",
      [id, appId, catalogItem.rows[0].name, plan || "Free", "provisioning"]
    );
    
    // Inject config var
    const configKey = catalogItem.rows[0].name.toUpperCase().replace(/ /g, "_") + "_URL";
    const configValue = addonId === 'bera-redis' ? redisUrl : 
                       addonId === 'bera-postgresql' ? postgresUrl :
                       `bera://${addonId}:${Math.random().toString(36).substring(2, 6)}@internal:5432`;
    
    await pgPool.query(
      "INSERT INTO config_vars (app_id, key, value) VALUES ($1, $2, $3)",
      [appId, configKey, configValue]
    );

    await pgPool.query(
      "INSERT INTO activity (app_id, actor, action, description) VALUES ($1, $2, $3, $4)",
      [appId, "system", "addon:create", `Attached ${catalogItem.rows[0].name}`]
    );

    // Clear caches
    await redisClient.del(`cache:/api/apps/${appId}/addons`);
    await redisClient.del(`cache:/api/apps/${appId}/config`);

    res.json({ success: true });
  });

  app.get("/api/apps/:id/activity", cacheMiddleware(30), async (req, res) => {
    const result = await pgPool.query(
      "SELECT * FROM activity WHERE app_id = $1 ORDER BY timestamp DESC",
      [req.params.id]
    );
    res.json(result.rows);
  });

  app.post("/api/apps/:id/deploy", async (req, res) => {
    const { branch } = req.body;
    const appId = req.params.id;

    await pgPool.query("UPDATE apps SET status = 'deploying' WHERE id = $1", [appId]);
    res.json({ status: "started" });

    const releaseCount = await pgPool.query(
      "SELECT COUNT(*) as count FROM releases WHERE app_id = $1",
      [appId]
    );
    
    const steps = [
      "-----> Building source...",
      "-----> Cloning repository...",
      `-----> Detected environment: Node.js`,
      "-----> Installing dependencies...",
      "       Running: npm install",
      "       Added 452 packages in 4s",
      "-----> Building assets...",
      "       Running: npm run build",
      "       Build successful (1.2s)",
      "-----> Discovering process types",
      "       Procfile declares types: web",
      "-----> Compressing...",
      "       Done: 42.5MB",
      "-----> Launching...",
      `       Released v${parseInt(releaseCount.rows[0].count) + 1}`,
      `-----> App is live at https://berahost.up.railway.app/${appId}`
    ];

    for (const step of steps) {
      await broadcastLog(appId, "build", step);
      await new Promise(r => setTimeout(r, 800));
    }

    await pgPool.query(
      "UPDATE apps SET status = 'running', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [appId]
    );
    
    await createRelease(appId, `Deploy ${branch || 'main'}`);

    // Track deployment in Redis for analytics
    await redisClient.incr('stats:total_deploys');
    await redisClient.zAdd('stats:deploys_by_app', {
      score: Date.now(),
      value: appId
    });
  });

  app.get("/api/apps/:id/releases", cacheMiddleware(60), async (req, res) => {
    const result = await pgPool.query(
      "SELECT * FROM releases WHERE app_id = $1 ORDER BY version DESC",
      [req.params.id]
    );
    res.json(result.rows);
  });

  // Redis stats endpoint
  app.get("/api/stats", async (req, res) => {
    const totalDeploys = await redisClient.get('stats:total_deploys') || '0';
    const recentDeploys = await redisClient.zRange('stats:deploys_by_app', 0, -1, { REV: true });
    
    res.json({
      totalDeploys: parseInt(totalDeploys),
      recentDeploys: recentDeploys.slice(0, 10)
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Bera Host Server running on http://0.0.0.0:${PORT}`);
    console.log(`PostgreSQL: Connected`);
    console.log(`Redis: Connected`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await redisClient.quit();
  await pgPool.end();
  process.exit(0);
});

startServer().catch(console.error);
