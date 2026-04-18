import { error, json, type RequestHandler } from '@sveltejs/kit';
import { dayKey, getRedis, toDayLog } from '$lib/server/redis';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 400;

function addDaysISO(date: string, delta: number): string {
	const [y, m, d] = date.split('-').map(Number);
	const dt = new Date(y, m - 1, d);
	dt.setDate(dt.getDate() + delta);
	const yy = dt.getFullYear();
	const mm = String(dt.getMonth() + 1).padStart(2, '0');
	const dd = String(dt.getDate()).padStart(2, '0');
	return `${yy}-${mm}-${dd}`;
}

export const GET: RequestHandler = async ({ url }) => {
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');
	if (!from || !to || !DATE_RE.test(from) || !DATE_RE.test(to)) error(400, 'invalid range');
	if (from > to) error(400, 'from > to');

	const dates: string[] = [];
	for (let d = from; d <= to; d = addDaysISO(d, 1)) {
		dates.push(d);
		if (dates.length > MAX_DAYS) error(400, 'range too large');
	}

	const redis = await getRedis();
	const multi = redis.multi();
	for (const d of dates) multi.hGetAll(dayKey(d));
	const results = (await multi.exec()) as unknown as Array<Record<string, string>>;

	const out: Record<string, Record<string, number>> = {};
	dates.forEach((d, i) => {
		const log = toDayLog(results[i] ?? {});
		if (Object.keys(log).length) out[d] = log;
	});
	return json(out);
};
