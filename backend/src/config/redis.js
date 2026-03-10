import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.on("connect",  () => console.log("✅ Redis connected"));
client.on("error",    (err) => console.error("❌ Redis error:", err.message));

await client.connect();

// ─── Cache helpers ─────────────────────────────────────────────────────────

// Get cached value (returns parsed JSON or null)
export const cacheGet = async (key) => {
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

// Set cache with TTL in seconds
export const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error("Cache set error:", err.message);
  }
};

// Delete a cache key (call after mutation)
export const cacheDel = async (key) => {
  try {
    await client.del(key);
  } catch (err) {
    console.error("Cache del error:", err.message);
  }
};

export default client;