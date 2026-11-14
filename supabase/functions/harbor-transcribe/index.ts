// Ventra optional STT fallback. Authenticated adults only; never save child audio.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const ORIGINS = new Set([
  'https://ventraapp.vercel.app',
  'http://localhost', // Android Capacitor WebView origin
  'http://localhost:3000',
  'http://localhost:3001',
  'capacitor://localhost',
  ...(Deno.env.get('VENTRA_ALLOWED_ORIGINS') ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
]);
const json = (data: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'vary': 'Origin',
      ...(origin && ORIGINS.has(origin)
        ? { 'access-control-allow-origin': origin } : {})
    }
  });
const permittedAudio = new Set(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav', 'audio/mpeg']);
const uuid = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

Deno.serve(async req => {
  const origin = req.headers.get('origin');
  // Never reflect arbitrary Origins for a service that handles children's voices.
  if (origin && !ORIGINS.has(origin))
    return json({ error: 'origin-denied' }, 403, null);
  if (req.method === 'OPTIONS')
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': origin ?? 'https://ventraapp.vercel.app',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'authorization, apikey, content-type, x-ventra-profile',
        'access-control-max-age': '600',
        'vary': 'Origin'
      }
    });
  if (req.method !== 'POST') return json({ error: 'method-not-allowed' }, 405, origin);

  const mime = (req.headers.get('content-type') ?? '').split(';')[0].toLowerCase();
  const length = Number(req.headers.get('content-length') ?? 0);
  const profileId = (req.headers.get('x-ventra-profile') ?? '').trim();
  if (!permittedAudio.has(mime) || !uuid.test(profileId) || length > 1_500_000)
    return json({ error: 'invalid-audio-request' }, 400, origin);

  const bearer = req.headers.get('authorization') ?? '';
  if (!/^Bearer\s+\S+$/i.test(bearer))
    return json({ error: 'adult-login-required' }, 401, origin);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  if (!supabaseUrl || !publicKey)
    return json({ error: 'server-not-configured' }, 503, origin);

  // Scoped user client: getUser() verifies the JWT with Supabase Auth.
  const client = createClient(supabaseUrl, publicKey, {
    global: { headers: { Authorization: bearer } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const token = bearer.replace(/^Bearer\s+/i, '');
  const { data: { user }, error: authError } = await client.auth.getUser(token);
  if (authError || !user)
    return json({ error: 'adult-login-required' }, 401, origin);

  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) return json({ error: 'transcription-not-configured' }, 503, origin);

  // SECURITY DEFINER RPC requires a profile owned by the authenticated adult.
  // It serializes and bounds requests (10/min, 120/day); no child voice is saved.
  const { data: authorized, error: quotaError } =
    await client.rpc('authorize_harbor_transcription', { p_profile_id: profileId });
  if (quotaError) return json({ error: 'quota-unavailable' }, 503, origin);
  if (authorized !== true) return json({ error: 'not-authorized-or-rate-limited' }, 429, origin);

  let audio: ArrayBuffer;
  try { audio = await req.arrayBuffer(); }
  catch { return json({ error: 'invalid-audio-request' }, 400, origin); }
  if (audio.byteLength < 1_500 || audio.byteLength > 1_500_000)
    return json({ error: 'invalid-audio-request' }, 400, origin);

  const extension = mime === 'audio/mp4' ? 'm4a' :
    mime === 'audio/ogg' ? 'ogg' :
    mime === 'audio/wav' ? 'wav' : mime === 'audio/mpeg' ? 'mp3' : 'webm';
  const form = new FormData();
  form.set('file', new File([audio], 'answer.' + extension, { type: mime }));
  form.set('model', 'whisper-large-v3-turbo');
  form.set('language', 'en');
  form.set('response_format', 'json');
  form.set('temperature', '0');

  // Abort provider calls rather than occupying an Edge worker indefinitely.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey },
      body: form,
      signal: controller.signal
    });
    if (!response.ok) {
      // Deliberately don't log child audio, model text, or upstream response.
      return json({ error: response.status === 429
        ? 'provider-rate-limited' : 'provider-unavailable' }, 503, origin);
    }
    const payload: unknown = await response.json();
    const text = payload && typeof payload === 'object' && 'text' in payload &&
      typeof payload.text === 'string' ? payload.text.trim().slice(0, 180) : '';
    return json({ text }, 200, origin);
  } catch {
    return json({ error: 'provider-timeout-or-network' }, 503, origin);
  } finally {
    clearTimeout(timeout);
  }
});
