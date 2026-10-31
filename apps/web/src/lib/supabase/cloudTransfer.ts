/**
 * Offline-first sync transport. Keep acknowledgements behind successful writes
 * so an interrupted network transfer remains retriable and idempotent.
 */
export async function uploadInBatches<T>(
  pending: readonly T[],
  send: (batch: T[]) => Promise<void>,
  acknowledge: (batch: T[]) => Promise<void>,
  batchSize = 100
): Promise<number> {
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error('Geçersiz gönderim paket boyutu.');
  let uploaded = 0;
  for (let start = 0; start < pending.length; start += batchSize) {
    const batch = pending.slice(start, start + batchSize);
    await send(batch);
    await acknowledge(batch);
    uploaded += batch.length;
  }
  return uploaded;
}

export async function mergeRemotePages<T>(
  fetchPage: (offset: number, end: number) => Promise<T[]>,
  merge: (events: T[]) => Promise<number>,
  pageSize = 500
): Promise<number> {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('Geçersiz sayfa boyutu.');
  let merged = 0;
  for (let offset = 0; ; offset += pageSize) {
    const page = await fetchPage(offset, offset + pageSize - 1);
    if (!Array.isArray(page)) throw new Error('Bulut sayfası okunamadı.');
    if (page.length > pageSize) throw new Error('Bulut sayfası beklenenden büyük.');
    if (page.length) merged += await merge(page);
    if (page.length < pageSize) return merged;
  }
}

/** Never report a completed cloud deletion unless the authenticated parent
 * actually updated the intended child's record. A zero-row update may mean
 * that the row was removed, ownership changed, or RLS rejected visibility.
 */
export function assertChildTombstoneAcknowledged(
  profileId: string,
  updated: ReadonlyArray<{ id: string }> | null
): void {
  if (!Array.isArray(updated) || updated.length !== 1 || updated[0]?.id !== profileId) {
    throw new Error('Bulut bu çocuk profilinin silindiğini doğrulamadı. Yerel silme kaydı korunuyor; tekrar deneyin.');
  }
}
