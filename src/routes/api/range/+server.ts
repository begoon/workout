import { error, json, type RequestHandler } from '@sveltejs/kit';
import { daysCol, toDayLog } from '$lib/server/mongo';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 400;

function daysBetween(from: string, to: string): number {
	const [fy, fm, fd] = from.split('-').map(Number);
	const [ty, tm, td] = to.split('-').map(Number);
	const start = Date.UTC(fy, fm - 1, fd);
	const end = Date.UTC(ty, tm - 1, td);
	return Math.round((end - start) / 86_400_000) + 1;
}

export const GET: RequestHandler = async ({ url }) => {
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');
	if (!from || !to || !DATE_RE.test(from) || !DATE_RE.test(to)) error(400, 'invalid range');
	if (from > to) error(400, 'from > to');
	if (daysBetween(from, to) > MAX_DAYS) error(400, 'range too large');

	const days = await daysCol();
	const docs = await days.find({ date: { $gte: from, $lte: to } }).toArray();

	const out: Record<string, Record<string, number>> = {};
	for (const doc of docs) {
		const log = toDayLog(doc.exercises);
		if (Object.keys(log).length) out[doc.date] = log;
	}
	return json(out);
};
