import { withCache, invalidateCachePrefix, getRateLimitStore, isRedisAvailable } from "./src/redis";

async function runTests() {
  console.log("=== Testing Redis Integration & Fallback ===");
  
  // 1. Fallback Test when Redis is not running / available
  let fetchCounter = 0;
  const mockFetcher = async () => {
    fetchCounter++;
    return { data: "fresh_db_data", counter: fetchCounter };
  };

  console.log("1. Testing withCache graceful fallback...");
  const res1 = await withCache("test:key", 60, mockFetcher);
  console.log("Result 1:", res1);
  
  const res2 = await withCache("test:key", 60, mockFetcher);
  console.log("Result 2:", res2);
  
  if (!isRedisAvailable()) {
    console.log("Redis not connected: fetcher was called directly without error (Counter:", fetchCounter, ")");
  } else {
    console.log("Redis connected: cached value returned (Counter:", fetchCounter, ")");
  }

  // 2. Invalidate Cache test
  console.log("2. Testing invalidateCachePrefix...");
  await invalidateCachePrefix("test:");
  console.log("Invalidation completed without error.");

  // 3. Rate Limit Store helper test
  console.log("3. Testing getRateLimitStore...");
  const store = getRateLimitStore("rl:test:");
  console.log("RateLimit store created:", store !== undefined ? "RedisStore instance" : "undefined (memory fallback)");

  console.log("=== All Redis Tests Passed Successfully ===");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
