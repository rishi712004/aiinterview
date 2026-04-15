import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      if (retries > 5) return false; // stop retrying after 5 attempts
      return Math.min(retries * 500, 3000);
    },
  },
});

client.on("connect",  () => console.log("✅ Redis connected"));
client.on("error",    (err) => console.error("❌ Redis error:", err.message));
client.on("reconnecting", () => console.log("🔄 Redis reconnecting..."));

// Connect without blocking server startup
client.connect().catch((err) => {
  console.error("❌ Redis initial connect failed:", err.message);
});

// ─── Cache helpers ─────────────────────────────────────────────────────────
export const cacheGet = async (key) => {
  try {
    if (!client.isReady) return null;
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    if (!client.isReady) return;
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error("Cache set error:", err.message);
  }
};

export const cacheDel = async (key) => {
  try {
    if (!client.isReady) return;
    await client.del(key);
  } catch (err) {
    console.error("Cache del error:", err.message);
  }
};

export default client;
