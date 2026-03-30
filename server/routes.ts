import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { Readable } from "node:stream";
import { getUncachableGoogleDriveClient } from "./googleDrive";

export async function registerRoutes(app: Express): Promise<Server> {

  app.post("/api/backup", async (req: Request, res: Response) => {
    try {
      const { expenses, incomes } = req.body;
      if (!Array.isArray(expenses) || !Array.isArray(incomes)) {
        return res.status(400).json({ error: "Invalid backup data" });
      }

      const drive = await getUncachableGoogleDriveClient();
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const fileName = `spendwise_backup_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.json`;

      const content = JSON.stringify({ version: 1, backedUpAt: now.toISOString(), expenses, incomes });
      const stream = Readable.from([content]);

      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: "application/json",
          parents: ["appDataFolder"],
        },
        media: {
          mimeType: "application/json",
          body: stream,
        },
        fields: "id,name,createdTime,size",
      });

      res.json({ success: true, file: response.data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Backup failed";
      console.error("Backup error:", err);
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/backup/list", async (_req: Request, res: Response) => {
    try {
      const drive = await getUncachableGoogleDriveClient();
      const response = await drive.files.list({
        spaces: "appDataFolder",
        fields: "files(id,name,createdTime,size)",
        orderBy: "createdTime desc",
        pageSize: 20,
        q: "name contains 'spendwise_backup'",
      });
      res.json({ files: response.data.files || [] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to list backups";
      console.error("List backups error:", err);
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/backup/:fileId", async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const drive = await getUncachableGoogleDriveClient();
      const response = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "text" }
      );
      const data = typeof response.data === "string"
        ? JSON.parse(response.data)
        : response.data;
      res.json(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch backup";
      console.error("Fetch backup error:", err);
      res.status(500).json({ error: message });
    }
  });

  app.delete("/api/backup/:fileId", async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const drive = await getUncachableGoogleDriveClient();
      await drive.files.delete({ fileId });
      res.json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete backup";
      console.error("Delete backup error:", err);
      res.status(500).json({ error: message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
