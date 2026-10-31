# Ventra Kids — P0/P1/P2 Release Acceptance
**Review date:** 2026-11-01
**Scope:** local anonymous child profiles, adult-owned cloud accounts, offline event reconciliation and child-data safety.
**Environment:** local web & native builds. No Vercel or Play deployment is authorised.

## Implemented in the November hardening sprint
- Adult identity is checked using the authenticated Supabase user, not trusted solely from a cached session.
- Sync calls for one child in one application session share their in-flight result; repeated button presses do not run concurrent copies.
- Pending sessions upload in idempotent batches of 100, marked locally as synced only after a successful server write.
- Downloaded learning history is paginated in ordered batches of 500 instead of being truncated at the default Supabase row limit; profile restoration is paginated too.
- A local tombstone only reports successful server deletion when Supabase confirms no error; no unverified successful deletion messages.
- The parent Sync button reconciles *both* remote profiles and deletion tombstones, not just currently visible local profiles.
- Child profile deletion from the Kids selector is gated when it belongs to an adult. The parent screen requires confirmation and remote acknowledgement before deleting the local record.
- The adult-account deletion function no longer treats deletion of child rows as successful deletion of the adult account when the authenticated server RPC fails.
- Both local progress repositories reject attempts to merge a cloud event explicitly belonging to a different child profile.
- Tests cover 1,203 event pagination, mid-batch network failure/retry, duplicate reconciliation, cross-child isolation and protection against false successful account deletion.

## Automated checks
- `npm run type-check`
- `npm --workspace=apps/web run test:ci` (no live Supabase credentials in public CI)
- `npm run build:web` and mobile static export
- Native Android API-36 debug build + unsigned release bundle, and unsigned iOS Simulator build.
- CI runs `npm audit --omit=dev --audit-level=high` as an advisory check. Any finding must be triaged; a green build is **not** security clearance.
- Local full test: `npm --workspace=apps/web test` with configured `apps/web/.env.local`.
- Existing Supabase metadata migration `20261101000000_kids_learning_metadata.sql` is required for cross-device grade/English level. After applying it, enable `NEXT_PUBLIC_VENTRA_CLOUD_METADATA_V2=true` in local environment. Never expose a Supabase service-role key in client variables.

## Physical two-device acceptance (NOT YET VERIFIED)
Use two non-production test devices A and B with the same authenticated test adult; observe child profile UUID, stars and lesson status. **Do not perform destructive testing on a real child's account.**

1. **First launch/guest:** On A create a test child (nickname, avatar, grade, starting English level). Play a level. Kill/reopen app and verify the same UUID and stars. Check that it still works in airplane mode.
2. **Explicit link:** Sign in as the adult on A. Link the child from Parent Area and run sync. Check no new child was silently created and local stars stay unchanged.
3. **Restore B:** Sign in as the *same* adult on B, choose "Buluttan Getir". The child UUID, avatar, grade, language preference and lesson stars should match A. Repeat restore twice; no new child, double stars or extra event is allowed.
4. **Bidirectional:** Play new lessons on B, sync B. Sync/restore on A; then complete a different level on A, sync A and B. Both displays must converge.
5. **Concurrent offline:** Turn both A and B offline, finish different tasks and replay the same level with different star scores. Restore network, sync A then B then A. Best stars must win per level; all separate answer evidence must survive; replay must not farm coins or duplicate stars.
6. **Interruption:** Disconnect network while uploading, observe a failure message and preserved local progress. Reconnect and retry; do not accept half-synced UI as success.
7. **Account isolation:** Sign in as a *different* adult. The child's cloud records must never be readable or transferable under that account without a separately designed ownership-transfer process.
8. **Deletion:** From authenticated Parent Area delete a *test* child. Confirm that B removes it after sync/restore; the deleted ID must not resurrect. A failed remote deletion must preserve A's local copy and show an error.
9. **Account deletion:** On a throwaway parent account only, verify RPC deletion and login rejection. If the RPC fails, the UI must say **failed**, never "account deleted".
10. **Mobile quality:** Confirm on physical Android and iPhone: in-game touch areas, voice availability, background/resume, logout, low connectivity and cold restart.

## Release blockers / known limits
- The above live Supabase, physical Android/iPhone and offline-device acceptance has not been performed by automated CI; P2 remains **PARTIAL** until the user reports actual results.
- Cross-device metadata depends on the v2 SQL migration and client flag; do not claim it works in an environment missing either.
- Event merge on a large history can be slow; measure latency and investigate retries during device testing.
- Vulnerable dependencies identified by npm audit remain an open P0 gate until severity, reachability and compatible upgrades have been reviewed.
- P3 (assessed placement/learning efficacy), P4 physical child/UX QA, P5 coins, P6 school and P7 billing/store policy are separate future gates.

## Actual GitHub CI findings on the source commit
- Run: https://github.com/ventragame/ventra/actions/runs/41253543619
- Tested SHA: `e1960672bd3cbbe8b48ebcb9760d85b45add15fc`
- 60 of 60 offline tests passed, 0 failed; TypeScript and production Next.js build passed.
- Android API 36 unsigned AAB/debug build passed; iOS Simulator unsigned build passed.
- `npm ci` reported **7 total vulnerabilities** (4 moderate, 2 high, 1 critical). Runtime dependency audit (`npm audit --omit=dev --audit-level=high`) reported **2**: a high and a moderate finding in the Next.js/PostCSS dependency chain. Safe remediation needs a planned Next.js 16 upgrade or verified equivalent patched dependencies; `npm audit fix --force` would perform a breaking major upgrade and was not run.
- The audit step is intentionally advisory and can fail without failing the compilation pipeline: **CI success is not a security sign-off**.
- Latest parent UI indicator / timestamp patches must pass a subsequent CI run before source head is marked fully verified.
