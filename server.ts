import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { app as apiApp } from './api/index.js';

let __filename = '';
let __dirname = '';
try {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
  }
} catch (e) {
  // Fallback
}

const app = express();
app.use(express.json());

// Bind Vercel api routes directly to local express app
app.use(apiApp);

// Serve static assets in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to React router SPA page
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Local server running on http://localhost:${PORT}`);
});
