import { error, json, type RequestHandler } from '@sveltejs/kit';
import { daysCol, toDayLog } from '$lib/server/mongo';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const GET: RequestHandler = async ({ params }) => {
	if (!params.date || !DATE_RE.test(params.date)) error(400, 'invalid date');
	const days = await daysCol();
	const doc = await days.findOne({ date: params.date });
	return json(toDayLog(doc?.exercises));
};
