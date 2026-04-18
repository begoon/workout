import { createClient } from 'redis';
import { env } from '$env/dynamic/private';

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let connecting: Promise<RedisClient> | null = null;

export async function getRedis(): Promise<RedisClient> {
	if (client?.isOpen) return client;
	if (connecting) return connecting;
	connecting = (async () => {
		if (!env.REDIS_URL) throw new Error('REDIS_URL is not set');
		const c = createClient({ url: env.REDIS_URL });
		c.on('error', (err: unknown) => console.error('[redis]', err));
		await c.connect();
		client = c;
		connecting = null;
		return c;
	})();
	return connecting;
}

export const DAY_PREFIX = 'workout:day:';
export const dayKey = (date: string) => `${DAY_PREFIX}${date}`;

export function toDayLog(hash: Record<string, string>): Record<string, number> {
	const out: Record<string, number> = {};
	for (const [k, v] of Object.entries(hash)) {
		const n = Number(v);
		if (n > 0) out[k] = n;
	}
	return out;
}
