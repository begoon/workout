import { error, json, type RequestHandler } from '@sveltejs/kit';
import { EXERCISES_KEY, getRedis } from '$lib/server/redis';
import { DEFAULT_EXERCISES, MAX_EXERCISES, NAME_RE, normalizeName } from '$lib/exercises';

export const GET: RequestHandler = async () => {
	const redis = await getRedis();
	const raw = await redis.get(EXERCISES_KEY);
	if (!raw) return json([...DEFAULT_EXERCISES]);
	try {
		const list = JSON.parse(raw);
		if (!Array.isArray(list) || !list.every((x) => typeof x === 'string')) {
			return json([...DEFAULT_EXERCISES]);
		}
		return json(list);
	} catch {
		return json([...DEFAULT_EXERCISES]);
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!Array.isArray(body)) error(400, 'expected array');

	const seen = new Set<string>();
	const cleaned: string[] = [];
	for (const raw of body) {
		if (typeof raw !== 'string') error(400, 'non-string entry');
		const name = normalizeName(raw);
		if (!name) continue;
		if (!NAME_RE.test(name)) error(400, `invalid name: ${name}`);
		if (seen.has(name)) continue;
		seen.add(name);
		cleaned.push(name);
	}
	if (cleaned.length > MAX_EXERCISES) error(400, `too many (max ${MAX_EXERCISES})`);

	const redis = await getRedis();
	await redis.set(EXERCISES_KEY, JSON.stringify(cleaned));
	return json(cleaned);
};
