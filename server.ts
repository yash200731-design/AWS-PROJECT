import dotenv from "dotenv";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import app from "./api/app";

// Load environment variables
dotenv.config();

async function startServer() {
  const PORT = 3000;

  // Serve frontend assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Green Code Choice app listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
