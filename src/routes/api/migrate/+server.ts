import { error, json, type RequestHandler } from '@sveltejs/kit';
import { dayKey, getRedis } from '$lib/server/redis';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as Record<string, Record<string, unknown>>;
	if (!body || typeof body !== 'object') error(400, 'invalid body');

	const redis = await getRedis();
	const imported: string[] = [];
	const skipped: string[] = [];

	for (const [date, log] of Object.entries(body)) {
		if (!DATE_RE.test(date) || !log || typeof log !== 'object') continue;
		const key = dayKey(date);
		const existing = await redis.hGetAll(key);
		if (Object.keys(existing).length > 0) {
			skipped.push(date);
			continue;
		}
		const entries: [string, string][] = [];
		for (const [exc, v] of Object.entries(log)) {
			const n = Math.max(0, Math.floor(Number(v)));
			if (n > 0 && typeof exc === 'string' && exc) entries.push([exc, String(n)]);
		}
		if (entries.length) {
			await redis.hSet(key, Object.fromEntries(entries));
			imported.push(date);
		}
	}

	return json({ imported, skipped });
};
