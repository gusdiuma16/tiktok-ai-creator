import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import generateHandler from "./api/generate";

const app = express();
const PORT = 3000;

app.use(express.json());

// Multi-provider rotation flow delegated to standard API handler
app.post("/api/generate", async (req: Request, res: Response) => {
  try {
    await generateHandler(req, res);
  } catch (error: any) {
    console.error("API error in server.ts delegator:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
