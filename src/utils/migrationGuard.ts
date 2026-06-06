import { MIGRATION_IN_PROGRESS_KEY, MIGRATION_TIMEOUT } from '@/services/migration/constants';

export async function waitForMigration(): Promise<void> {
  if (typeof window === 'undefined') return;

  const raw = localStorage.getItem(MIGRATION_IN_PROGRESS_KEY);
  if (!raw) return;

  try {
    const { startedAt } = JSON.parse(raw);
    const age = Date.now() - new Date(startedAt).getTime();

    if (age >= MIGRATION_TIMEOUT) return;

    const maxWait = Math.ceil(MIGRATION_TIMEOUT / 50);
    let count = 0;

    while (localStorage.getItem(MIGRATION_IN_PROGRESS_KEY) && count < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      count++;
    }
  } catch {
    // Ignore malformed lock data
  }
}
