// Vercel Serverless Function: /api/notify
// Đọc TOKEN_GROUP (bot token) và TOKEN_ID (chat/group ID) từ env vars
// Không bao giờ lộ token ra client

export default async function handler(req, res) {
  // Chỉ cho POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.TOKEN_GROUP;
  const chatId   = process.env.TOKEN_ID;

  if (!botToken || !chatId) {
    console.error('Missing TOKEN_GROUP or TOKEN_ID env vars');
    return res.status(500).json({ error: 'Server config missing' });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const tgRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await tgRes.json();

    if (!data.ok) {
      console.error('Telegram error:', data);
      return res.status(502).json({ error: data.description });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('notify error:', e);
    return res.status(500).json({ error: e.message });
  }
}
