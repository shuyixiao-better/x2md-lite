import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import type { IncomingMessage } from "node:http";
import react from "@vitejs/plugin-react";
import { createExtractResult } from "./src/server/handleExtract";

function x2mdDevApiPlugin(): Plugin {
  return {
    name: "x2md-dev-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res, next) => {
        if (req.method !== "POST" || req.url !== "/api/extract") {
          next();
          return;
        }

        const body = await readRequestBody(req);

        try {
          const payload = JSON.parse(body) as { url?: unknown };
          const result = await createExtractResult(
            { url: typeof payload.url === "string" ? payload.url : "" },
            {
              X_API_BEARER_TOKEN: process.env.X_API_BEARER_TOKEN,
              X_EXTRACT_API_KEY: process.env.X_EXTRACT_API_KEY
            }
          );

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(result));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Request handling failed.";

          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ success: false, message }));
        }
      });
    }
  };
}

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk: string | Buffer) => {
      raw += chunk.toString();
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

export default defineConfig({
  plugins: [react(), x2mdDevApiPlugin()]
});
