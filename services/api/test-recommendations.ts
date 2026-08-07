import { getDb } from "./src/db";
import { sql } from "drizzle-orm";
import recommendationsRouter from "./src/routes/recommendations.routes";
import express from "express";
import fs from "fs";
import path from "path";

// Load .env manually
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"]|['"]$/g, "");
      process.env[match[1]] = val;
    }
  });
}

async function test() {
  const app = express();
  app.use(express.json());
  app.use("/recommendations", recommendationsRouter);

  const server = app.listen(3099, async () => {
    console.log("Testing POST /recommendations...");

    try {
      const response = await fetch("http://localhost:3099/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concernCategory: "skin concern",
          preferredLanguage: "Hindi",
          preferredMode: "video"
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Server returned an error:", response.status, text);
        throw new Error("Request failed");
      }

      const data = await response.json();
      console.log("Status:", response.status);
      console.log("Response Body:");
      console.log(JSON.stringify(data, null, 2));

      // Check database log
      const db = getDb();
      const dbLog = await db.execute(sql`SELECT * FROM recommendation_events ORDER BY created_at DESC LIMIT 1`);
      console.log("\nDatabase Log:");
      console.log(dbLog.rows[0]);

    } catch (e) {
      console.error("Test failed:", e);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

test();
