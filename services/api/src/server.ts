import express, { type Express } from "express";

export const createServer = (): Express => {
  const app = express();

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "medlink-api" });
  });

  return app;
};
