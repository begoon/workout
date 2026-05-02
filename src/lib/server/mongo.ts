import { env } from '$env/dynamic/private';
import { MongoClient, type Collection, type Db, type ObjectId } from 'mongodb';

let client: MongoClient | null = null;
let connecting: Promise<MongoClient> | null = null;

async function getClient(): Promise<MongoClient> {
	if (client) return client;
	if (connecting) return connecting;
	connecting = (async () => {
		if (!env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
		const c = new MongoClient(env.MONGODB_URI);
		await c.connect();
		client = c;
		connecting = null;
		await ensureIndexes(c.db('workout'));
		return c;
	})();
	return connecting;
}

export type DayLog = Record<string, number>;

export interface DayDoc {
	_id?: ObjectId;
	date: string;
	exercises: DayLog;
}

export interface ExerciseDoc {
	_id?: ObjectId;
	name: string;
	order: number;
}

export async function getDb(): Promise<Db> {
	const c = await getClient();
	return c.db('workout');
}

export async function daysCol(): Promise<Collection<DayDoc>> {
	const db = await getDb();
	return db.collection<DayDoc>('days');
}

export async function exercisesCol(): Promise<Collection<ExerciseDoc>> {
	const db = await getDb();
	return db.collection<ExerciseDoc>('exercises');
}

export function toDayLog(raw: DayLog | undefined): DayLog {
	const out: DayLog = {};
	if (!raw) return out;
	for (const [k, v] of Object.entries(raw)) {
		if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[k] = v;
	}
	return out;
}

let indexesEnsured = false;

async function ensureIndexes(db: Db) {
	if (indexesEnsured) return;
	indexesEnsured = true;
	await db.collection<DayDoc>('days').createIndex({ date: 1 }, { unique: true });
	await db.collection<ExerciseDoc>('exercises').createIndex({ name: 1 }, { unique: true });
	await db.collection<ExerciseDoc>('exercises').createIndex({ order: 1 });
}
