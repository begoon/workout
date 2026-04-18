import { error, json, type RequestHandler } from '@sveltejs/kit';
import { dayKey, getRedis, toDayLog } from '$lib/server/redis';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const POST: RequestHandler = async ({ params, request }) => {
	const date = params.date;
	if (!date || !DATE_RE.test(date)) error(400, 'invalid date');

	const { exercise, delta } = (await request.json()) as { exercise?: unknown; delta?: unknown };
	if (typeof exercise !== 'string' || !exercise) error(400, 'invalid exercise');
	const d = Math.trunc(Number(delta));
	if (!Number.isFinite(d) || d === 0) error(400, 'invalid delta');

	const redis = await getRedis();
	const key = dayKey(date);

	if (d > 0) {
		await redis.hIncrBy(key, exercise, d);
	} else {
		const current = Number((await redis.hGet(key, exercise)) ?? 0);
		const next = Math.max(0, current + d);
		if (next === 0) await redis.hDel(key, exercise);
		else await redis.hSet(key, exercise, String(next));
	}

	const hash = await redis.hGetAll(key);
	return json(toDayLog(hash));
};
