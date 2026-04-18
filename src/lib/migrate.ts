const LS_PREFIX = 'workout:';
const MIGRATED_FLAG = 'workout:migrated-to-redis';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function migrateLocalStorageOnce(): Promise<void> {
	if (typeof localStorage === 'undefined') return;
	if (localStorage.getItem(MIGRATED_FLAG)) return;

	const payload: Record<string, unknown> = {};
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (!key?.startsWith(LS_PREFIX)) continue;
		const date = key.slice(LS_PREFIX.length);
		if (!DATE_RE.test(date)) continue;
		const raw = localStorage.getItem(key);
		if (!raw) continue;
		try {
			payload[date] = JSON.parse(raw);
		} catch {
			/* ignore malformed */
		}
	}

	if (Object.keys(payload).length === 0) {
		localStorage.setItem(MIGRATED_FLAG, '1');
		return;
	}

	try {
		const res = await fetch('/api/migrate', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (res.ok) {
			localStorage.setItem(MIGRATED_FLAG, '1');
			const { imported, skipped } = (await res.json()) as {
				imported: string[];
				skipped: string[];
			};
			console.info('[migrate]', { imported: imported.length, skipped: skipped.length });
		}
	} catch (err) {
		console.warn('[migrate] failed, will retry on next load', err);
	}
}
