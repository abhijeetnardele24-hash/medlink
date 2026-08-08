import { getDb } from "./src/db";
import { prescriptions } from "./src/db/schema";
import fetch from "node-fetch"; // actually I can use global fetch

async function go() {
  const db = getDb();
  const p = await db.select().from(prescriptions).limit(1);
  if (!p.length) return console.log("no prescription");
  const res = await fetch(`http://localhost:3000/prescriptions/${p[0].id}/pdf`);
  console.log(await res.text());
  process.exit(0);
}
go();
