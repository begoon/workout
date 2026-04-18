import { error, json, type RequestHandler } from '@sveltejs/kit';
import { dayKey, getRedis, toDayLog } from '$lib/server/redis';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const GET: RequestHandler = async ({ params }) => {
	if (!params.date || !DATE_RE.test(params.date)) error(400, 'invalid date');
	const redis = await getRedis();
	const hash = await redis.hGetAll(dayKey(params.date));
	return json(toDayLog(hash));
};
