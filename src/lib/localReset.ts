import { deleteOfflineDatabase } from '@/lib/offlineStore';

const RECOVERY_FLAG = 'nutriplan-recovery-attempt';

export const STARTUP_TIMEOUT_MS = 3000;

export function withTimeout<T>(promise: Promise<T>, fallback: T, ms = STARTUP_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function hardReset() {
  try { localStorage.clear(); } catch { /* storage unavailable */ }
  await deleteOfflineDatabase();
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((regs ?? []).map((r) => r.unregister()));
    const keys = await caches?.keys?.();
    await Promise.all((keys ?? []).map((k) => caches.delete(k)));
  } catch {
    // best effort
  }
  window.location.reload();
}

/** True only for the first automatic recovery in this session, to avoid reload loops. */
export function claimRecoveryAttempt(): boolean {
  try {
    if (sessionStorage.getItem(RECOVERY_FLAG)) return false;
    sessionStorage.setItem(RECOVERY_FLAG, '1');
    return true;
  } catch {
    return false;
  }
}
