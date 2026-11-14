# Ventra Diyalog Limanı — Web Speech + independent STT fallback

## Why two engines?

The browser Web Speech `SpeechRecognition` API can receive microphone/speech events
but never deliver an `onresult` transcript, including on an unrelated website.
`processLocally = false` **does not force cloud recognition**; it permits the
browser to decide local versus remote. The browser vendor controls this engine.
The app cannot repair the vendor's decoder or force a service to return words.

We keep Web Speech for supported browsers, with an independent opt-in path using
short `MediaRecorder` audio captures and a guarded Supabase Edge Function
calling Groq Whisper. The independent path is **not active by default**.

## Security and privacy gates

- Only an explicitly opted-in adult-account session can use the independent path.
  No automatic upload when Web Speech fails; no child-facing permission forms.
- Server validates Supabase Auth token with `auth.getUser(token)`.
- A `SECURITY DEFINER` RPC verifies that the requested child profile belongs
  to the signed-in adult and atomically limits each adult to 10/minute and 120/day.
  `anon` has no table or RPC access.
- Audio clips are 3.5–8.5 seconds, <=1.5MB, deleted from JS memory after request.
  No audio files or transcripts are written to Ventra's database, storage or logs.
- The Edge Function only accepts `audio/webm`, `audio/ogg`, `audio/mp4`, etc.
  and an exact allowlist of origins, and it times out Groq requests.
- **Groq is a third party.** A privacy disclosure, proper parent authorization,
  data-processing terms and child-data regulatory review are required **before
  production activation**. Do not claim the upstream provider does not retain data.
- Rate limiting helps but does not replace vendor budget limits, abuse detection
  or operational monitoring. Consider a strict monthly spend cap.

## One-time installation (NOT performed by GitHub push)

1. Review and apply migration
   `supabase/migrations/20261114000000_harbor_speech_quotas.sql`
   through the Ventra Supabase SQL editor. The previous migrations defining
   `public.player_profiles` and its `user_id` ownership must already exist.
2. Create a Groq API key with the transcription endpoint enabled. Set the key
   as a **Supabase Edge Function server secret**, never a `NEXT_PUBLIC_` value:
   ```bash
   supabase secrets set GROQ_API_KEY="YOUR_SECRET" --project-ref YOUR_PROJECT_REF
   ```
3. If custom domains are in use, set explicit comma-delimited origins:
   ```bash
   supabase secrets set VENTRA_ALLOWED_ORIGINS="https://your-domain.example" --project-ref YOUR_PROJECT_REF
   ```
   `https://ventraapp.vercel.app`, `http://localhost:3000`,
   `http://localhost:3001`, `http://localhost` (Android WebView), and `capacitor://localhost` are in the default
   allowlist. The allowed origin alone is not authentication.
4. Deploy the function to the **same** Supabase project used by Ventra:
   ```bash
   supabase functions deploy harbor-transcribe --project-ref YOUR_PROJECT_REF
   ```
   Leave JWT verification enabled. Do not use `--no-verify-jwt`.
5. Set `NEXT_PUBLIC_HARBOR_STT_ENABLED=true` in
   `apps/web/.env.local` and, if desired, in Vercel environment variables.
   Restart the local dev server or redeploy Vercel to include this build-time
   public flag. No Groq or service-role secrets belong in Vercel client env.
6. Sign in as an **adult** with a cloud-synced child profile, open
   Diyalog Limanı → `Ses tanıma çalışmıyor mu?` and select
   `Bağımsız konuşma tanımayı etkinleştir`.
   Only future deliberate microphone clicks transmit short audio.
7. Test `Hello!` and expected incorrect answers on Chrome/Edge, then Safari,
   Android and iOS. Confirm no false success for noise, silence or replayed TTS.
   Test failed provider request and expired adult JWT. Review vendor security,
   costs and legal requirements before allowing real children to use it.

## Expected behaviour

- **Web Speech** remains the default; successful `onresult` text is matched
  against the game phrase. `onaudiostart` / `onspeechstart` are **not**
  evidence that any word was recognized.
- **Independent mode** records a single short utterance through MediaRecorder,
  locally checks for nontrivial audio activity, then sends it over HTTPS to
  the Supabase function, and compares returned text to the accepted phrases.
- If the Edge Function was not deployed, lacks `GROQ_API_KEY`, the user has not
  signed in, the profile is not cloud-owned by the adult, the quota is exceeded
  or the provider fails, the game reports a diagnostic without awarding points.
- Touch answer remains available. Results are a **word recognition signal**,
  not a scientifically validated pronunciation score.

## Limits

A key-free, zero-setup remote STT provider does not exist. The Edge Function
cannot work until a project administrator configures the provider secret,
migration and deployment. GitHub Actions type-checks and builds the web app,
but they cannot verify microphone hardware or Groq account availability.
