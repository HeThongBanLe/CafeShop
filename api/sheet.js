// Vercel Serverless Function: /api/sheet
// Proxy đến Google Apps Script Web App
// URL Apps Script giấu trong env var TOKEN_GOOGLE_SHEEET

export default async function handler(req, res) {
  // CORS (cho phép gọi từ vercel app domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sheetUrl = process.env.TOKEN_GOOGLE_SHEEET;
  if (!sheetUrl) {
    console.error('Missing TOKEN_GOOGLE_SHEEET env var');
    return res.status(500).json({ ok: false, error: 'Server config missing' });
  }

  try {
    let action, payload;

    if (req.method === 'POST') {
      payload = req.body || {};
      action = payload.action;
    } else if (req.method === 'GET') {
      action = req.query.action || 'read';
      payload = {
        action,
        fromDate: req.query.fromDate,
        toDate:   req.query.toDate,
      };
    } else {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    if (!action) return res.status(400).json({ ok: false, error: 'Missing action' });

    // Gọi Apps Script
    const gRes = await fetch(sheetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Apps Script trả về 302 redirect → cần follow
      redirect: 'follow',
    });

    const text = await gRes.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(502).json({ ok: false, error: 'Bad response from sheet', raw: text.slice(0, 200) }); }

    return res.status(200).json(data);
  } catch (e) {
    console.error('sheet api error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
