const SUPABASE_URL = 'https://dfqbdopeprehdkxurqgp.supabase.co';
const AUTH_URL = `${SUPABASE_URL}/auth/v1`;
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_C6DQ4DbR-g1kum5HU7wFqg_ARYXuYA2';
const STORAGE_KEY = 'sb-dfqbdopeprehdkxurqgp-auth-token';

const authorizationId = new URLSearchParams(location.search).get('authorization_id');
const login = document.getElementById('login');
const consent = document.getElementById('consent');
const status = document.getElementById('status');
const signIn = document.getElementById('signIn');
let session = readSession();
let requestDetails;

function readSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (stored?.access_token && (!stored.expires_at || stored.expires_at * 1000 > Date.now())) return stored;
  } catch {}
  return null;
}

function showError(message) {
  status.textContent = message || 'The request could not be completed. Please try again.';
}

async function authRequest(path, { method = 'GET', body } = {}) {
  const headers = { apikey: SUPABASE_PUBLISHABLE_KEY };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${AUTH_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.msg || data.message || data.error_description || data.error || `Request failed (${response.status})`);
  }
  return data;
}

async function loadRequest() {
  if (!authorizationId) {
    showError('This approval link is missing its request ID. Start connecting again from your assistant.');
    return;
  }
  if (!session?.access_token) {
    login.hidden = false;
    consent.hidden = true;
    return;
  }

  const data = await authRequest(`/oauth/authorizations/${encodeURIComponent(authorizationId)}`);
  if (data.redirect_url) {
    location.replace(data.redirect_url);
    return;
  }

  requestDetails = data;
  document.getElementById('clientName').textContent = data.client?.name || 'Unnamed app';
  document.getElementById('scopeList').textContent = data.scope || 'No additional profile scopes';
  document.getElementById('redirectUri').textContent = data.redirect_uri || 'Not provided';
  login.hidden = true;
  consent.hidden = false;
  status.textContent = '';
}

document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  signIn.disabled = true;
  status.textContent = 'Signing in securely with Supabase…';
  try {
    session = await authRequest('/token?grant_type=password', {
      method: 'POST',
      body: {
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
      }
    });
    document.getElementById('password').value = '';
    await loadRequest();
  } catch (error) {
    showError(error.message);
  } finally {
    signIn.disabled = false;
  }
});

document.getElementById('approve').addEventListener('click', async () => {
  if (!requestDetails || !authorizationId) return;
  document.getElementById('approve').disabled = true;
  document.getElementById('deny').disabled = true;
  status.textContent = 'Approving access…';
  try {
    const data = await authRequest(`/oauth/authorizations/${encodeURIComponent(authorizationId)}/consent`, {
      method: 'POST',
      body: { action: 'approve' }
    });
    if (!data.redirect_url) throw new Error('Supabase did not return the connection redirect.');
    location.assign(data.redirect_url);
  } catch (error) {
    showError(error.message);
    document.getElementById('approve').disabled = false;
    document.getElementById('deny').disabled = false;
  }
});

document.getElementById('deny').addEventListener('click', async () => {
  if (!authorizationId) return;
  document.getElementById('approve').disabled = true;
  document.getElementById('deny').disabled = true;
  status.textContent = 'Declining access…';
  try {
    const data = await authRequest(`/oauth/authorizations/${encodeURIComponent(authorizationId)}/consent`, {
      method: 'POST',
      body: { action: 'deny' }
    });
    if (!data.redirect_url) throw new Error('Supabase did not return the decline redirect.');
    location.assign(data.redirect_url);
  } catch (error) {
    showError(error.message);
    document.getElementById('approve').disabled = false;
    document.getElementById('deny').disabled = false;
  }
});

loadRequest().catch((error) => {
  login.hidden = false;
  consent.hidden = true;
  showError(error.message);
});
