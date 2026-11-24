#!/usr/bin/env node
/**
 * Ventra regression runner.
 *
 * Discovers every `tests/*.test.mjs` file so a newly added regression test can
 * never silently stay outside `npm test` / CI again (five P1 suites were missed
 * that way before this runner existed).
 *
 *   node scripts/run-tests.mjs          → every suite (local, may need .env.local)
 *   node scripts/run-tests.mjs --ci     → every suite except those needing live services
 *   node scripts/run-tests.mjs foo bar  → only suites whose file name contains foo or bar
 */
import {spawnSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const testsDir=join(root,'tests');

/** Suites that talk to a live Supabase project; CI has no credentials for them. */
const LIVE_SERVICE_SUITES=new Set(['e2e_supabase_sync.test.mjs']);

const args=process.argv.slice(2);
const ci=args.includes('--ci');
const filters=args.filter(arg=>!arg.startsWith('--'));

const files=readdirSync(testsDir)
 .filter(name=>name.endsWith('.test.mjs'))
 .filter(name=>!(ci&&LIVE_SERVICE_SUITES.has(name)))
 .filter(name=>filters.length===0||filters.some(filter=>name.includes(filter)))
 .sort()
 .map(name=>join('tests',name));

if(files.length===0){
 console.error('No test files matched.');
 process.exit(1);
}

// On GitHub Actions failing tests also become annotations (readable without
// access to the job log); the usual spec output stays on stdout.
const reporters=process.env.GITHUB_ACTIONS?['--test-reporter=spec','--test-reporter-destination=stdout',
 '--test-reporter=./scripts/github-annotations-reporter.mjs','--test-reporter-destination=stdout']:[];
const result=spawnSync(process.execPath,
 ['--test','--experimental-strip-types','--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',...reporters,...files],
 {cwd:root,stdio:'inherit'});
if(result.error){
 console.error(result.error);
 process.exit(1);
}
process.exit(result.status??1);
