#!/usr/bin/env bun
/// <reference types="bun" />
import { writeFileSync } from 'node:fs';
import process from 'node:process';
import { MongoClient } from 'mongodb';

const url = process.env.MONGODB_URI;
if (!url) {
	console.error('MONGODB_URI not set (populate .env or export it in the shell)');
	process.exit(1);
}

const OUT_FILE = process.argv[2] ?? 'workout-data.json';

const client = new MongoClient(url);
await client.connect();
try {
	const db = client.db('workout');

	const exercises = await db.collection('exercises').find({}).sort({ order: 1 }).toArray();
	const days = await db.collection('days').find({}).sort({ date: 1 }).toArray();

	const sanitize = <T extends { _id: unknown }>(doc: T): T => ({
		...doc,
		_id: String(doc._id)
	});

	const payload = {
		exportedAt: new Date().toISOString(),
		exercises: exercises.map(sanitize),
		days: days.map(sanitize)
	};

	writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n');
	console.log(`wrote ${exercises.length} exercise(s) and ${days.length} day(s) to ${OUT_FILE}`);
} finally {
	await client.close();
}
