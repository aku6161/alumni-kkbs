import express, { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json({ limit: '15mb' }));

const HOMECOMING_DRIVE_FOLDER_ID = '1FeJfBi6hMg_8doCOaN3m7MCHc09cSiAa';

// Helper to get Google OAuth access token from Service Account JSON (if configured via env var)
const getGoogleDriveAccessTokenFromServiceAccount = async (saJsonStr: string): Promise<string | null> => {
  try {
    const sa = JSON.parse(saJsonStr);
    if (!sa.client_email || !sa.private_key) return null;

    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claimSet = Buffer.from(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      })
    ).toString('base64url');

    const signatureInput = `${header}.${claimSet}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    const signature = signer.sign(sa.private_key, 'base64url');
    const jwt = `${signatureInput}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });
    const tokenData: any = await tokenRes.json();
    return tokenData.access_token || null;
  } catch (err) {
    console.error('Failed to obtain Google Service Account access token:', err);
    return null;
  }
};

// Proxy helper to relay requests to Google Apps Script Web App
const relayToAppsScript = async (url: string, payload: any) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: `Respons tidak sah dari Apps Script (${response.status}): ${text.slice(0, 200)}` };
    }
  } catch (error: any) {
    return { success: false, error: error.toString() };
  }
};

// Route: Upload payment proof for Alumni Homecoming Night to Google Drive folder
app.post('/api/upload-drive-proof', async (req: Request, res: Response) => {
  try {
    const {
      fileName,
      mimeType,
      fileBase64,
      folderId = HOMECOMING_DRIVE_FOLDER_ID,
      appsScriptUrl,
      registrationData,
    } = req.body || {};

    if (!fileName || !fileBase64) {
      return res.status(400).json({ success: false, error: 'Fail bukti bayaran tidak lengkap.' });
    }

    const cleanBase64 = String(fileBase64).replace(/^data:[^;]+;base64,/, '');

    // Option 1: Direct Google Drive API v3 upload using Service Account env var (if configured on Vercel)
    const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (saJson) {
      const accessToken = await getGoogleDriveAccessTokenFromServiceAccount(saJson);
      if (accessToken) {
        const boundary = `-------alumni_kkbs_${Date.now()}`;
        const metadataPart = JSON.stringify({
          name: fileName,
          parents: [folderId],
          description: registrationData
            ? `Bukti bayaran Alumni Homecoming Night: ${registrationData.nama || ''} (${registrationData.participantType || ''}) - RM ${registrationData.totalAmount || 0}`
            : 'Bukti bayaran Alumni Homecoming Night',
        });

        const fileBuffer = Buffer.from(cleanBase64, 'base64');
        const multipartBody = Buffer.concat([
          Buffer.from(
            `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataPart}\r\n--${boundary}\r\nContent-Type: ${mimeType || 'application/octet-stream'}\r\nContent-Transfer-Encoding: base64\r\n\r\n`
          ),
          Buffer.from(fileBuffer.toString('base64')),
          Buffer.from(`\r\n--${boundary}--`),
        ]);

        const driveRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartBody,
          }
        );

        const driveData: any = await driveRes.json();
        if (driveRes.ok && driveData.id) {
          return res.json({
            success: true,
            fileId: driveData.id,
            fileName: driveData.name || fileName,
            fileUrl: driveData.webViewLink || `https://drive.google.com/file/d/${driveData.id}/view`,
          });
        }
      }
    }

    // Option 2: Google Apps Script Web App URL (configured via SystemConfig or env var)
    const targetScriptUrl =
      (typeof appsScriptUrl === 'string' && appsScriptUrl.trim()) ||
      process.env.DRIVE_UPLOAD_APPS_SCRIPT_URL ||
      process.env.APPS_SCRIPT_URL ||
      '';

    if (!targetScriptUrl) {
      return res.json({
        success: false,
        code: 'NOT_CONFIGURED',
        error: 'URL Google Apps Script untuk simpanan automatik ke Google Drive belum ditetapkan.',
      });
    }

    const result = await relayToAppsScript(targetScriptUrl, {
      action: 'upload_homecoming_proof',
      folderId,
      fileName,
      mimeType: mimeType || 'application/octet-stream',
      fileBase64: cleanBase64,
      registrationData,
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.toString() });
  }
});

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
