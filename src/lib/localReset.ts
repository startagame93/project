export const STORAGE_KEY = 'nutriplan-state-v1';
export const PENDING_KEY = 'nutriplan-pending-sync';
export const OWNER_KEY = 'nutriplan-state-owner';
const RECOVERY_FLAG = 'nutriplan-recovery-attempt';

export const STARTUP_TIMEOUT_MS = 3000;

export function withTimeout<T>(promise: Promise<T>, fallback: T, ms = STARTUP_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/** Drops the cached diet/app data but keeps the login session, so the cloud copy reloads cleanly. */
export function clearLocalAppData() {
  try {
    [STORAGE_KEY, PENDING_KEY, OWNER_KEY].forEach((k) => localStorage.removeItem(k));
  } catch {
    // storage unavailable
  }
}

export async function hardReset() {
  try { localStorage.clear(); } catch { /* storage unavailable */ }
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
