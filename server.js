require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;
const UPSTREAM_BASE = 'https://rediprofiles.com/api/v1';
const API_KEY = process.env.REDIPROFILES_API_KEY;

if (!API_KEY) {
  console.error('Missing required environment variable REDIPROFILES_API_KEY');
  process.exit(1);
}

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH', 'DELETE']);

// Only allow documented path prefixes through the proxy.
const ALLOWED_PREFIXES = [
  /^\/profiles\/?$/,
  /^\/profiles\/balance\/?$/,
  /^\/keys\/?$/,
  /^\/keys\/\d+\/?$/,
  /^\/services\/?$/,
  /^\/services\/\d+\/?$/,
  /^\/orders\/?$/,
  /^\/orders\/[^/]+\/?$/,
  /^\/api-orders\/?$/,
  /^\/api-orders\/[^/]+\/?$/,
  /^\/auth\/token\/?$/,
  /^\/auth\/token\/refresh\/?$/,
];

function isPathAllowed(path) {
  return ALLOWED_PREFIXES.some(re => re.test(path));
}

app.all('/api/v1/*splat', async (req, res) => {
  if (!ALLOWED_METHODS.has(req.method)) {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const subPath = req.originalUrl.replace(/^\/api\/v1/, '').split('?')[0];
  if (!isPathAllowed(subPath)) {
    return res.status(404).json({ error: 'Unknown endpoint' });
  }

  const upstreamUrl = `${UPSTREAM_BASE}${req.originalUrl.replace(/^\/api\/v1/, '')}`;
  const hasBody = req.method !== 'GET' && req.method !== 'DELETE';

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: {
        'X-API-KEY': API_KEY,
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      },
      body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
    });

    // Propagate rate-limit signal if upstream sent it
    const retryAfter = upstream.headers.get('retry-after');
    if (retryAfter) res.set('Retry-After', retryAfter);

    if (upstream.status === 204) return res.status(204).end();

    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'application/json';
    res.status(upstream.status).type(contentType).send(text);
  } catch (error) {
    console.error(`[proxy] ${req.method} ${upstreamUrl} failed:`, error);
    res.status(502).json({ error: 'Upstream request failed', detail: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
