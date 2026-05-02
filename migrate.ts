#!/usr/bin/env bun
/// <reference types="bun" />
import process from 'node:process';
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';

import { DEFAULT_EXERCISES } from './src/lib/exercises.ts';

const REDIS_URL = process.env.REDIS_URL;
const MONGODB_URI = process.env.MONGODB_URI;
if (!REDIS_URL) {
	console.error('REDIS_URL not set');
	process.exit(1);
}
if (!MONGODB_URI) {
	console.error('MONGODB_URI not set');
	process.exit(1);
}

const DAY_PREFIX = 'workout:day:';
const EXERCISES_KEY = 'workout:exercises';
const DB_NAME = 'workout';

type DayLog = Record<string, number>;

function toDayLog(hash: Record<string, string>): DayLog {
	const out: DayLog = {};
	for (const [k, v] of Object.entries(hash)) {
		const n = Number(v);
		if (Number.isFinite(n) && n > 0) out[k] = n;
	}
	return out;
}

const redis = createClient({ url: REDIS_URL });
redis.on('error', (err: unknown) => console.error('[redis]', err));
await redis.connect();

const mongo = new MongoClient(MONGODB_URI);
await mongo.connect();

try {
	const db = mongo.db(DB_NAME);
	const days = db.collection<{ date: string; exercises: DayLog }>('days');
	const exercises = db.collection<{ name: string; order: number }>('exercises');

	await days.createIndex({ date: 1 }, { unique: true });
	await exercises.createIndex({ name: 1 }, { unique: true });
	await exercises.createIndex({ order: 1 });

	// --- exercises ---
	let list: string[];
	try {
		const raw = await redis.get(EXERCISES_KEY);
		const parsed = raw ? JSON.parse(raw) : null;
		list =
			Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')
				? (parsed as string[])
				: [...DEFAULT_EXERCISES];
	} catch {
		list = [...DEFAULT_EXERCISES];
	}

	if (list.length) {
		const ops = list.map((name, i) => ({
			replaceOne: {
				filter: { name },
				replacement: { name, order: i },
				upsert: true
			}
		}));
		await exercises.bulkWrite(ops, { ordered: false });
	}
	await exercises.deleteMany({ name: { $nin: list } });

	console.log(`exercises: ${list.length} migrated → ${list.join(', ')}`);

	// --- days ---
	const keys: string[] = [];
	for await (const batch of redis.scanIterator({ MATCH: `${DAY_PREFIX}*`, COUNT: 100 })) {
		if (Array.isArray(batch)) keys.push(...batch);
		else keys.push(batch);
	}

	let written = 0;
	let skipped = 0;
	if (keys.length) {
		const multi = redis.multi();
		for (const k of keys) multi.hGetAll(k);
		const results = (await multi.exec()) as unknown as Array<Record<string, string>>;

		const ops: Array<{
			replaceOne: {
				filter: { date: string };
				replacement: { date: string; exercises: DayLog };
				upsert: boolean;
			};
		}> = [];

		keys.forEach((k, i) => {
			const date = k.slice(DAY_PREFIX.length);
			const log = toDayLog(results[i] ?? {});
			if (Object.keys(log).length === 0) {
				skipped++;
				return;
			}
			ops.push({
				replaceOne: {
					filter: { date },
					replacement: { date, exercises: log },
					upsert: true
				}
			});
		});

		if (ops.length) {
			const res = await days.bulkWrite(ops, { ordered: false });
			written = (res.upsertedCount ?? 0) + (res.modifiedCount ?? 0) + (res.matchedCount ?? 0);
		}
	}

	console.log(`days: ${written} migrated, ${skipped} empty skipped (out of ${keys.length} keys)`);

	const dayCount = await days.countDocuments();
	const excCount = await exercises.countDocuments();
	console.log(`mongo state: ${dayCount} day docs, ${excCount} exercise docs`);
} finally {
	await redis.quit();
	await mongo.close();
}
