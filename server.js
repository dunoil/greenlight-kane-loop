/*
 * Greenlight server — zero dependencies, Node's built-in http only.
 * Serves the InvoiceForge static app from public/ and the loop
 * engine's data from loop/ (loop-log.json, last-failure.md).
 *
 *   npm start   ->  http://localhost:4173
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 4173;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const LOOP_DIR = path.join(ROOT, 'loop');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad request');
    return;
  }

  // Loop engine data lives in loop/, not public/.
  if (urlPath === '/loop-log.json' || urlPath === '/loop/loop-log.json') {
    sendFile(res, path.join(LOOP_DIR, 'loop-log.json'));
    return;
  }
  if (urlPath === '/loop/last-failure.md') {
    sendFile(res, path.join(LOOP_DIR, 'last-failure.md'));
    return;
  }

  if (urlPath === '/') urlPath = '/index.html';

  // Resolve inside public/ and refuse anything that escapes it.
  const filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  sendFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Greenlight / InvoiceForge running at http://localhost:${PORT}`);
});
