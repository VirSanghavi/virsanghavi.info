// Minimal serverless endpoint for Vercel/Netlify-like environments.
// Expects environment variable: GEMINI_API_KEY
// This uses Google Generative AI (Gemini) for responses, but the key
// must be provided at deploy-time via env var.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
  }
  try {
    const { question, profile, systemPrompt } = req.body || {};
    if (!question || !profile) {
      return res.status(400).json({ error: 'Missing question or profile' });
    }

    // Construct a grounded prompt
    const prompt = `${systemPrompt}\n\nPROFILE JSON:\n${JSON.stringify(profile, null, 2)}\n\nUSER QUESTION: ${question}\n\nAnswer:`;

    // Call Gemini (text model)
    const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: { temperature: 0.3, topP: 0.9, topK: 40, maxOutputTokens: 512 }
      })
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const logToSupabase = async (payload) => {
      if (!supabaseUrl || !supabaseKey) return;
      try {
        await fetch(`${supabaseUrl}/rest/v1/ai_queries`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload)
        });
      } catch (_) { /* swallow logging errors */ }
    };

    if (!resp.ok) {
      const text = await resp.text();
      await logToSupabase({ query: question, ai_response: text, source: 'virsanghavi.info', status: 'error' });
      return res.status(502).json({ error: 'Upstream error', details: text });
    }

    const json = await resp.json();
    const answer = json?.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer available.';

    // Log success
    await logToSupabase({ query: question, ai_response: answer, source: 'virsanghavi.info', status: 'success' });
    return res.status(200).json({ answer });
  } catch (err) {
    console.error(err);
    // Log error
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/rest/v1/ai_queries`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: req?.body?.question || '', ai_response: 'server_error', source: 'virsanghavi.info', status: 'error' })
        });
      }
    } catch (_) {}
    return res.status(500).json({ error: 'Server error' });
  }
}
