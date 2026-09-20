import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// Proxy helper to relay requests to Google Apps Script Web App
const relayToAppsScript = async (url: string, payload: any) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.toString() };
  }
};

// Route: Get current data (Members, Transactions, Config)
app.get('/api/data', async (req: Request, res: Response) => {
  const appsScriptUrl = req.query.appsScriptUrl as string;
  if (!appsScriptUrl) {
    return res.status(400).json({ success: false, error: 'Sila masukkan Apps Script URL.' });
  }

  try {
    const response = await fetch(appsScriptUrl);
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.toString() });
  }
});

// Route: Relay post commands to Apps Script
app.post('/api/action', async (req: Request, res: Response) => {
  const appsScriptUrl = req.headers['x-apps-script-url'] as string;
  if (!appsScriptUrl) {
    return res.status(400).json({ success: false, error: 'Sila masukkan Apps Script URL.' });
  }

  const payload = req.body;
  const result = await relayToAppsScript(appsScriptUrl, payload);
  return res.json(result);
});

// Dev fallback default route
app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({ status: 'healthy', project: 'Alumni KKBS' });
});

export default app;
export { app };
