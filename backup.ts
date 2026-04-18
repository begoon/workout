#!/usr/bin/env bun
import { writeFileSync } from "node:fs";
import process from "node:process";
import { createClient } from "redis";

const url = process.env.REDIS_URL;
if (!url) {
    console.error("REDIS_URL not set (populate .env or export it in the shell)");
    process.exit(1);
}

const PREFIX = "workout:day:";
const OUT_FILE = process.argv[2] ?? "workout-data.json";

const client = createClient({ url });
client.on("error", (err: unknown) => console.error("[redis]", err));
await client.connect();

const keys: string[] = [];
for await (const batch of client.scanIterator({ MATCH: `${PREFIX}*`, COUNT: 100 })) {
    if (Array.isArray(batch)) keys.push(...batch);
    else keys.push(batch);
}

const out: Record<string, Record<string, number>> = {};
if (keys.length) {
    const multi = client.multi();
    for (const k of keys) multi.hGetAll(k);
    const results = (await multi.exec()) as unknown as Array<Record<string, string>>;

    keys.forEach((k, i) => {
        const date = k.slice(PREFIX.length);
        const log: Record<string, number> = {};
        for (const [exc, v] of Object.entries(results[i] ?? {})) {
            const n = Number(v);
            if (n > 0) log[exc] = n;
        }
        if (Object.keys(log).length) out[date] = log;
    });
}

await client.quit();

const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(OUT_FILE, JSON.stringify({ exportedAt: new Date().toISOString(), days: sorted }, null, 2) + "\n");

console.log(`wrote ${Object.keys(sorted).length} day(s) to ${OUT_FILE}`);
