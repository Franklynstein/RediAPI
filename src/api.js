const BASE_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function parseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildMessage(body, status) {
  if (!body) return `Request failed (${status})`;
  if (typeof body === 'string') return body;
  if (body.detail) return body.detail;
  if (body.error) return body.error;
  if (Array.isArray(body.non_field_errors)) return body.non_field_errors.join(', ');
  return `Request failed (${status})`;
}

async function request(path, { method = 'GET', body, query, retries = 2 } = {}) {
  const url = new URL(BASE_URL + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }
  }

  const init = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  };

  let attempt = 0;
  while (true) {
    const res = await fetch(url.toString(), init);

    if (res.status === 429 && attempt < retries) {
      const retryAfter = Number(res.headers.get('Retry-After')) || 2 ** attempt;
      await new Promise(r => setTimeout(r, Math.min(retryAfter, 10) * 1000));
      attempt++;
      continue;
    }

    if (res.status === 204) return null;

    const parsed = await parseBody(res);
    if (!res.ok) {
      throw new ApiError(buildMessage(parsed, res.status), { status: res.status, body: parsed });
    }
    return parsed;
  }
}

export const api = {
  getProfile: () => request('/profiles/'),
  getBalance: () => request('/profiles/balance/'),
  listServices: () => request('/services/'),
  getService: id => request(`/services/${id}/`),
  listOrders: ({ externalCustomerRef } = {}) =>
    request('/orders/', { query: { external_customer_ref: externalCustomerRef } }),
  getOrder: sqid => request(`/orders/${sqid}/`),
  createOrder: payload => request('/orders/', { method: 'POST', body: payload }),
  listApiOrders: ({ externalCustomerRef } = {}) =>
    request('/api-orders/', { query: { external_customer_ref: externalCustomerRef } }),
  getApiOrder: sqid => request(`/api-orders/${sqid}/`),
  listKeys: () => request('/keys/'),
};
