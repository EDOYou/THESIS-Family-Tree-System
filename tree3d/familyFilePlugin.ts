import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * Dev-server endpoint that lets the in-app editor read and save
 * family-data/family.json. Any device on the network may read it, but
 * only this computer may save, so other screens stay view-only.
 *
 *   GET /api/family  -> the file (404 if it does not exist yet)
 *   PUT /api/family  -> replaces the file; the previous version is kept
 *                       as family-data/family.prev.json
 */
export function familyFilePlugin(): Plugin {
  return {
    name: "family-file",
    configureServer(server) {
      // Outside public/ so saving does not make the dev server reload the page.
      const file = path.resolve(server.config.root, "family-data/family.json");
      const previous = path.resolve(server.config.root, "family-data/family.prev.json");

      server.middlewares.use("/api/family", async (req, res) => {
        const remote = req.socket.remoteAddress ?? "";
        const local = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remote);
        if (local) res.setHeader("X-Family-Editor", "1");

        if (req.method === "GET") {
          if (!existsSync(file)) {
            res.statusCode = 404;
            res.end();
            return;
          }
          res.setHeader("Content-Type", "application/json");
          res.end(await readFile(file));
          return;
        }

        if (req.method === "PUT" && !local) {
          res.statusCode = 403;
          res.end("Only the computer running the editor can save the tree.");
          return;
        }

        if (req.method === "PUT") {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          let data: unknown;
          try {
            data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          } catch {
            res.statusCode = 400;
            res.end("Not valid JSON");
            return;
          }
          if (!data || !Array.isArray((data as { people?: unknown }).people)) {
            res.statusCode = 400;
            res.end("Expected a tree snapshot with a people list");
            return;
          }
          await mkdir(path.dirname(file), { recursive: true });
          if (existsSync(file)) await copyFile(file, previous);
          // Write to a temporary file first so a crash never leaves half a file.
          const temp = `${file}.tmp`;
          await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
          await rename(temp, file);
          res.statusCode = 204;
          res.end();
          return;
        }

        res.statusCode = 405;
        res.end();
      });
    },
  };
}
