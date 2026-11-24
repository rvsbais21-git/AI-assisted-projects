const SUPABASE_URL = 'https://dfqbdopeprehdkxurqgp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_C6DQ4DbR-g1kum5HU7wFqg_ARYXuYA';
const SDK_SOURCES = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://unpkg.com/@supabase/supabase-js@2'
];

const authorizationId = new URLSearchParams(location.search).get('authorization_id');
const login = document.getElementById('login');
const consent = document.getElementById('consent');
const status = document.getElementById('status');
const signIn = document.getElementById('signIn');
let supabase;
let requestDetails;

function showError(message) {
  status.textContent = message || 'The request could not be completed. Please try again.';
}

function loadSupabaseSdk() {
  return new Promise((resolve, reject) => {
    let index = 0;
    const tryNext = () => {
      if (window.supabase?.createClient) {
        resolve(window.supabase);
        return;
      }
      if (index >= SDK_SOURCES.length) {
        reject(new Error('The sign-in library could not load. Please reload this page or try another browser/network.'));
        return;
      }
      const script = document.createElement('script');
      script.src = SDK_SOURCES[index++];
      script.onload = () => window.supabase?.createClient ? resolve(window.supabase) : tryNext();
      script.onerror = tryNext;
      document.head.appendChild(script);
    };
    tryNext();
  });
}

async function loadRequest() {
  if (!authorizationId) {
    showError('This approval link is missing its request ID. Start connecting again from your assistant.');
    return;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  if (!sessionData.session) {
    login.hidden = false;
    consent.hidden = true;
    return;
  }

  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error) throw error;
  if (data && 'redirect_url' in data && data.redirect_url) {
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
  if (!supabase) return;
  signIn.disabled = true;
  status.textContent = 'Signing in…';
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    });
    if (error) throw error;
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
    const { data, error } = await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true });
    if (error) throw error;
    if (!data?.redirect_url) throw new Error('Supabase did not return the connection redirect.');
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
    const { data, error } = await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });
    if (error) throw error;
    if (!data?.redirect_url) throw new Error('Supabase did not return the decline redirect.');
    location.assign(data.redirect_url);
  } catch (error) {
    showError(error.message);
    document.getElementById('approve').disabled = false;
    document.getElementById('deny').disabled = false;
  }
});

async function initialize() {
  try {
    const sdk = await loadSupabaseSdk();
    supabase = sdk.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    await loadRequest();
  } catch (error) {
    login.hidden = false;
    consent.hidden = true;
    signIn.disabled = true;
    showError(error.message);
  }
}

initialize();
