import { Router, type IRouter } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requireAdmin } from "../../middleware/requireAuth.js";

const router: IRouter = Router();

function getUploadsDir(): string {
    // This file runs from: artifacts/api-server/dist/routes/admin/uploads.js
    // We want: artifacts/affiliate-deals/dist/public/uploads
    const serverDir = path.dirname(fileURLToPath(import.meta.url)); // .../dist/routes/admin
    const projectRoot = path.resolve(serverDir, "..", "..", "..", ".."); // -> repo root
    return path.resolve(projectRoot, "artifacts", "affiliate-deals", "dist", "public", "uploads");
}

function getUploadsPublicUrl(filename: string): string {
    // Express static serves from affiliate-deals/dist/public
    return `/uploads/${filename}`;
}

const uploadsDir = getUploadsDir();

fs.mkdirSync(uploadsDir, { recursive: true });

const maxBytes = Number(process.env.UPLOAD_MAX_BYTES ?? 200 * 1024 * 1024);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        fs.mkdirSync(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const originalExt = path.extname(file.originalname || "");
        const safeExt = originalExt ? originalExt.toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
        const stamp = Date.now().toString(36);
        const rand = Math.random().toString(36).slice(2, 10);
        cb(null, `upload_${stamp}_${rand}${safeExt}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: maxBytes },
    fileFilter: (_req, file, cb) => {
        const mt = file.mimetype || "";
        // Requirement: accept all image/video types.
        // We still block non-media to prevent abuse.
        if (mt.startsWith("image/") || mt.startsWith("video/")) return cb(null, true);
        cb(new Error("Invalid file type. Only image/* and video/* are allowed."));
    },
});

router.post(
    "/admin/uploads",
    requireAdmin,
    upload.single("file"),
    (req, res): void => {
        const file = req.file;
        if (!file) {
            res.status(400).json({ error: "Missing file (field name must be: file)" });
            return;
        }

        res.json({
            url: getUploadsPublicUrl(file.filename),
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
        });
    },
);

export default router;
