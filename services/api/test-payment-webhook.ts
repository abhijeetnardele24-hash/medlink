import crypto from "crypto";
import express from "express";
import webhooksRouter from "./src/routes/webhooks.routes";
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
  app.use("/webhooks", webhooksRouter);

  const server = app.listen(3101, async () => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "demo_webhook_secret";

    // Simulate a Razorpay payment payload
  const payload = {
    entity: "event",
    account_id: "acc_demo",
    event: "payment.captured",
    contains: ["payment"],
    payload: {
      payment: {
        entity: {
          id: "pay_demo_12345",
          entity: "payment",
          amount: 50000,
          currency: "INR",
          status: "captured",
          order_id: "order_demo_12345",
          method: "upi"
        }
      }
    },
    created_at: Math.floor(Date.now() / 1000)
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");

  console.log("Simulating Razorpay Webhook...");
  console.log(`Event: ${payload.event}`);
  console.log(`Order ID: ${payload.payload.payment.entity.order_id}`);
  console.log(`Payment ID: ${payload.payload.payment.entity.id}`);
  console.log(`Generated Signature: ${signature}\n`);

  try {
    const res = await fetch("http://localhost:3101/webhooks/razorpay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": signature
      },
      body: payloadString
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ Webhook Failed (${res.status}):`, text);
    } else {
      const data = await res.json();
      console.log("✅ Webhook Processed Successfully:", data);
      console.log("Note: Because this is a simulated order_id that doesn't exist in the DB, it won't actually update any real rows, but the signature validation and handler flow succeeded!");
    }
    } catch (err) {
      console.error("❌ Request Failed:", err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

test();
