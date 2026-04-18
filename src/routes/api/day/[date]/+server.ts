import { error, json, type RequestHandler } from '@sveltejs/kit';
import { dayKey, getRedis, toDayLog } from '$lib/server/redis';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assertDate(date: string | undefined): asserts date is string {
	if (!date || !DATE_RE.test(date)) error(400, 'invalid date');
}

export const GET: RequestHandler = async ({ params }) => {
	assertDate(params.date);
	const redis = await getRedis();
	const hash = await redis.hGetAll(dayKey(params.date));
	return json(toDayLog(hash));
};

export const PUT: RequestHandler = async ({ params, request }) => {
	assertDate(params.date);
	const body = (await request.json()) as Record<string, unknown>;
	const redis = await getRedis();
	const key = dayKey(params.date);

	const entries: [string, string][] = [];
	for (const [exc, v] of Object.entries(body)) {
		const n = Math.max(0, Math.floor(Number(v)));
		if (n > 0) entries.push([exc, String(n)]);
	}

	await redis.del(key);
	if (entries.length) await redis.hSet(key, Object.fromEntries(entries));

	const hash = await redis.hGetAll(key);
	return json(toDayLog(hash));
};
