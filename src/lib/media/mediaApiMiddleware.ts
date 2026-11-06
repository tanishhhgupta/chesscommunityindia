import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB limit
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
]);

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface UploadPayload {
  fileName?: string;
  mimeType?: string;
  base64?: string;
  category?: string;
  altText?: string;
  dimensions?: string;
  replaceAssetId?: string;
  oldUrl?: string;
}

/**
 * Validates buffer headers (magic bytes) to ensure authentic image files.
 */
function validateMagicBytes(buf: Buffer, declaredMime?: string): { valid: boolean; detectedMime: string; error?: string } {
  if (buf.length < 4) {
    return { valid: false, detectedMime: '', error: 'File is empty or too small.' };
  }

  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) {
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4E &&
    buf[3] === 0x47 &&
    buf[4] === 0x0D &&
    buf[5] === 0x0A &&
    buf[6] === 0x1A &&
    buf[7] === 0x0A
  ) {
    return { valid: true, detectedMime: 'image/png' };
  }

  // WebP: RIFF .... WEBP
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { valid: true, detectedMime: 'image/webp' };
  }

  // SVG: starts with XML or SVG tag, text content
  const headStr = buf.toString('utf8', 0, Math.min(buf.length, 1024)).trim().toLowerCase();
  if (headStr.includes('<svg') || headStr.startsWith('<?xml')) {
    // Basic SVG sanitization: check for dangerous embedded scripts
    const fullStr = buf.toString('utf8');
    const dangerousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(fullStr)) {
        return {
          valid: false,
          detectedMime: 'image/svg+xml',
          error: 'SVG contains disallowed executable scripts or event handlers for security reasons.',
        };
      }
    }
    return { valid: true, detectedMime: 'image/svg+xml' };
  }

  return {
    valid: false,
    detectedMime: '',
    error: 'Corrupted or unsupported image file. Buffer magic bytes do not match valid JPG, PNG, WEBP, or SVG standards.',
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function sanitizeFilename(originalName: string, mime: string): string {
  const parsed = path.parse(originalName || 'image');
  let ext = parsed.ext.toLowerCase();

  if (!ext) {
    if (mime === 'image/jpeg') ext = '.jpg';
    else if (mime === 'image/png') ext = '.png';
    else if (mime === 'image/webp') ext = '.webp';
    else if (mime === 'image/svg+xml') ext = '.svg';
    else ext = '.png';
  }

  const base = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || 'media';

  const randomHash = crypto.randomBytes(4).toString('hex');
  const timestamp = Date.now();
  return `${base}-${timestamp}-${randomHash}${ext}`;
}

function isSafeUploadPath(baseDir: string, targetPath: string): boolean {
  const resolved = path.resolve(baseDir, targetPath);
  return resolved.startsWith(baseDir);
}

function applySecurityHeaders(req: IncomingMessage, res: ServerResponse): void {
  const origin = (req.headers.origin as string) || '';
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('chesscommunity.in'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function isAuthorizedAdmin(req: IncomingMessage): boolean {
  const authHeader = req.headers.authorization;
  const adminToken = req.headers['x-admin-token'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token.length >= 8) return true;
  }
  if (adminToken && typeof adminToken === 'string' && adminToken.trim().length >= 8) {
    return true;
  }
  // Allow local development origin
  const referer = req.headers.referer || '';
  if (referer.includes('localhost') || referer.includes('127.0.0.1')) {
    return true;
  }
  return false;
}

export function handleMediaApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): void {
  const url = req.url || '';

  // Directly serve dynamic uploaded files from /public/uploads/ with exact MIME headers
  if (url.startsWith('/uploads/')) {
    try {
      const parsed = new URL(url, 'http://localhost:3000');
      const fileName = path.basename(parsed.pathname);
      const filePath = path.join(UPLOADS_DIR, fileName);

      if (!isSafeUploadPath(UPLOADS_DIR, filePath)) {
        res.statusCode = 403;
        res.end('Forbidden: Invalid file path traversal.');
        return;
      }

      if (fs.existsSync(filePath)) {
        const ext = path.extname(fileName).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
        };
        const mime = mimeMap[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.statusCode = 200;
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    } catch (err) {
      console.warn('[Media Middleware] Error streaming upload file:', err);
    }
    return next();
  }

  if (!url.startsWith('/api/media')) {
    return next();
  }

  applySecurityHeaders(req, res);

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
    res.statusCode = 204;
    res.end();
    return;
  }

  // Default JSON header
  res.setHeader('Content-Type', 'application/json');

  const parsedUrl = new URL(url, 'http://localhost:3000');
  const pathname = parsedUrl.pathname;

  // 1. GET /api/media/list - List files on disk in /public/uploads
  if (pathname === '/api/media/list' && req.method === 'GET') {
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      const fileList = files.map((file) => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          url: `/uploads/${file}`,
          sizeBytes: stats.size,
          sizeFormatted: formatBytes(stats.size),
          modifiedAt: stats.mtime.toISOString(),
        };
      });
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, count: fileList.length, files: fileList }));
      return;
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: `Failed to list files: ${err.message}` }));
      return;
    }
  }

  // 2. POST /api/media/upload - Upload new image or replacement from PC
  if ((pathname === '/api/media/upload' || pathname === '/api/media/replace') && req.method === 'POST') {
    if (!isAuthorizedAdmin(req)) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Unauthorized: Administrative credentials required for media modification.' }));
      return;
    }

    let bodyChunks: Buffer[] = [];
    let totalLength = 0;

    req.on('data', (chunk: Buffer) => {
      totalLength += chunk.length;
      if (totalLength > MAX_FILE_SIZE * 1.5) {
        // Enforce maximum body size protection
        res.statusCode = 413;
        res.end(JSON.stringify({ error: `Payload too large. Maximum file size is 15MB.` }));
        req.destroy();
        return;
      }
      bodyChunks.push(chunk);
    });

    req.on('end', async () => {
      try {
        const rawBody = Buffer.concat(bodyChunks).toString('utf8');
        let payload: UploadPayload;

        try {
          payload = JSON.parse(rawBody);
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON request body.' }));
          return;
        }

        if (!payload.base64) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing base64 file data.' }));
          return;
        }

        // Clean base64 header if present (e.g. data:image/png;base64,...)
        const base64Data = payload.base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
        const fileBuffer = Buffer.from(base64Data, 'base64');

        if (fileBuffer.length > MAX_FILE_SIZE) {
          res.statusCode = 413;
          res.end(JSON.stringify({ error: `File size (${formatBytes(fileBuffer.length)}) exceeds maximum 15MB limit.` }));
          return;
        }

        // Validate buffer magic bytes
        const validation = validateMagicBytes(fileBuffer, payload.mimeType);
        if (!validation.valid) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: validation.error || 'Invalid file format.' }));
          return;
        }

        const safeMime = validation.detectedMime;
        const safeFileName = sanitizeFilename(payload.fileName || 'upload', safeMime);
        const destinationPath = path.join(UPLOADS_DIR, safeFileName);

        // Save file to public/uploads
        await fs.promises.writeFile(destinationPath, fileBuffer);

        const publicUrl = `/uploads/${safeFileName}`;
        const sizeFormatted = formatBytes(fileBuffer.length);

        // If replacing an old uploaded file, clean up old disk file if safe and in /uploads/
        if (payload.oldUrl && payload.oldUrl.startsWith('/uploads/')) {
          const oldFileName = path.basename(payload.oldUrl);
          const oldFilePath = path.join(UPLOADS_DIR, oldFileName);
          if (fs.existsSync(oldFilePath) && oldFilePath !== destinationPath) {
            try {
              await fs.promises.unlink(oldFilePath);
              console.log(`[Media Middleware] Cleaned up replaced file: ${oldFileName}`);
            } catch (unlinkErr) {
              console.warn(`[Media Middleware] Could not delete old file ${oldFileName}:`, unlinkErr);
            }
          }
        }

        res.statusCode = 200;
        res.end(
          JSON.stringify({
            success: true,
            asset: {
              url: publicUrl,
              fileName: safeFileName,
              name: payload.fileName || safeFileName,
              sizeBytes: fileBuffer.length,
              sizeFormatted: sizeFormatted,
              mimeType: safeMime,
              dimensions: payload.dimensions || '1280 x 800',
              category: payload.category || 'general',
              altText: payload.altText || payload.fileName || 'Uploaded image',
              uploadedAt: new Date().toISOString(),
              uploadedBy: 'Admin',
              replaceAssetId: payload.replaceAssetId || null,
            },
          })
        );
      } catch (err: any) {
        console.error('[Media Middleware] Upload error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: `Internal server error during upload: ${err.message}` }));
      }
    });

    req.on('error', (err) => {
      console.error('[Media Middleware] Request stream error:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Upload stream failed.' }));
    });
    return;
  }

  // 3. DELETE /api/media/delete - Remove uploaded file from disk
  if (pathname === '/api/media/delete' && (req.method === 'POST' || req.method === 'DELETE')) {
    if (!isAuthorizedAdmin(req)) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Unauthorized: Administrative credentials required for media deletion.' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        let fileUrl: string | undefined;
        if (body.trim()) {
          try {
            const parsed = JSON.parse(body);
            fileUrl = parsed.url;
          } catch {
            // body was not JSON
          }
        }
        if (!fileUrl) {
          fileUrl = parsedUrl.searchParams.get('url') || undefined;
        }

        if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid file URL or not a stored upload file.' }));
          return;
        }

        const fileName = path.basename(fileUrl);
        const filePath = path.join(UPLOADS_DIR, fileName);

        if (!isSafeUploadPath(UPLOADS_DIR, filePath)) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: 'Forbidden: Path traversal not permitted.' }));
          return;
        }

        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, message: `Deleted ${fileName}` }));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'File not found on disk.' }));
        }
      } catch (err: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message || 'Failed to delete file.' }));
      }
    });
    return;
  }

  // If not matched, pass to next middleware
  next();
}
