import { error, json, type RequestHandler } from '@sveltejs/kit';
import { exercisesCol } from '$lib/server/mongo';
import { DEFAULT_EXERCISES, MAX_EXERCISES, NAME_RE, normalizeName } from '$lib/exercises';

export const GET: RequestHandler = async () => {
	const exercises = await exercisesCol();
	const docs = await exercises.find({}).sort({ order: 1 }).toArray();
	if (docs.length === 0) return json([...DEFAULT_EXERCISES]);
	return json(docs.map((d) => d.name));
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

	const exercises = await exercisesCol();
	if (cleaned.length) {
		await exercises.bulkWrite(
			cleaned.map((name, i) => ({
				replaceOne: {
					filter: { name },
					replacement: { name, order: i },
					upsert: true
				}
			})),
			{ ordered: false }
		);
	}
	await exercises.deleteMany({ name: { $nin: cleaned } });

	return json(cleaned);
};
