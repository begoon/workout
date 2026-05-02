import { error, json, type RequestHandler } from '@sveltejs/kit';
import type { UpdateFilter } from 'mongodb';
import { daysCol, toDayLog, type DayDoc } from '$lib/server/mongo';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const POST: RequestHandler = async ({ params, request }) => {
	const date = params.date;
	if (!date || !DATE_RE.test(date)) error(400, 'invalid date');

	const { exercise, delta } = (await request.json()) as { exercise?: unknown; delta?: unknown };
	if (typeof exercise !== 'string' || !exercise) error(400, 'invalid exercise');
	const d = Math.trunc(Number(delta));
	if (!Number.isFinite(d) || d === 0) error(400, 'invalid delta');

	const days = await daysCol();
	const field = `exercises.${exercise}`;

	const after = await days.findOneAndUpdate(
		{ date },
		{ $inc: { [field]: d } } as UpdateFilter<DayDoc>,
		{ upsert: true, returnDocument: 'after' }
	);

	const value = after?.exercises?.[exercise] ?? 0;
	if (value <= 0) {
		await days.updateOne({ date }, { $unset: { [field]: '' } });
		const next = await days.findOne({ date });
		const log = toDayLog(next?.exercises);
		if (next && Object.keys(log).length === 0) {
			await days.deleteOne({ date });
		}
		return json(log);
	}

	return json(toDayLog(after?.exercises));
};
