import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

import { CloudSyncService } from '../src/lib/supabase/sync.ts';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';

// 1. .env.local yapılandırmasını oku
const envPath = path.resolve('.env.local');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [k, ...vParts] = trimmed.split('=');
    const key = k.trim();
    const val = vParts.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
      supabaseUrl = val;
      process.env.NEXT_PUBLIC_SUPABASE_URL = val;
    }
    if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' || key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
      if (!supabaseKey) {
        supabaseKey = val;
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = val;
      }
    }
  }
}

test('Live Supabase Connectivity & Client Readiness (Read-Only)', async () => {
  assert.ok(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL tanımlı olmalı');
  assert.ok(supabaseKey, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tanımlı olmalı');
  assert.ok(supabaseUrl.startsWith('https://'), 'Canlı URL https protokolü içermeli');

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // 1. Auth Canlılık Denetimi
  const { error: sessionError } = await client.auth.getSession();
  assert.equal(sessionError, null, 'Canlı Supabase Auth oturum sorgusu hatasız yanıt vermeli');

  // 2. Canlı Tablo Varlığı ve Anon Rol Kısıtı
  const { error: profileError } = await client.from('player_profiles').select('*').limit(1);
  assert.ok(profileError, 'Anonim kullanıcı player_profiles tablosunu okuyamamalı');
  assert.match(profileError.message, /permission denied for table player_profiles/i, 'Tablo mevcut ve yetki reddedilmeli');

  const { error: eventError } = await client.from('progress_events').select('*').limit(1);
  assert.ok(eventError, 'Anonim kullanıcı progress_events tablosunu okuyamamalı');
  assert.match(eventError.message, /permission denied for table progress_events/i, 'Tablo mevcut ve yetki reddedilmeli');

  // 3. Canlı RPC Güvenlik Kısıtı
  const { error: rpcError } = await client.rpc('delete_adult_user');
  assert.ok(rpcError, 'Anonim kullanıcı delete_adult_user RPC fonksiyonunu çağıramamalı');
  assert.match(rpcError.message, /permission denied for function delete_adult_user/i, 'Fonksiyon mevcut ve yetki reddedilmeli');
});

test('Sync Service: Unauthenticated Guard & Offline Safe Fallback', async () => {
  const sync = CloudSyncService.getInstance();
  const res = await sync.syncProfile('non_existent_profile');
  
  // Canlı ortamda oturum açık değilken güvenli hata dönmeli, uygulama çökmemeli
  assert.equal(res.success, false);
  assert.match(res.errorMessage, /Yetişkin hesabı oturumu açık değil/i);
});
