import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/mongo';

export const GET: RequestHandler = async () => {
	const db = await getDb();
	const t0 = performance.now();
	await db.command({ ping: 1 });
	const ms = Math.round(performance.now() - t0);
	return json({ ms });
};
