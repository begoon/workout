import type { DayLog, Storage } from './types';

const LS_PREFIX = 'workout:';

function lsWrite(date: string, log: DayLog) {
	if (typeof localStorage === 'undefined') return;
	const trimmed: DayLog = {};
	for (const [k, v] of Object.entries(log)) if (v > 0) trimmed[k] = v;
	if (Object.keys(trimmed).length) {
		localStorage.setItem(LS_PREFIX + date, JSON.stringify(trimmed));
	} else {
		localStorage.removeItem(LS_PREFIX + date);
	}
}

function lsRead(date: string): DayLog | null {
	if (typeof localStorage === 'undefined') return null;
	const raw = localStorage.getItem(LS_PREFIX + date);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as DayLog;
	} catch {
		return null;
	}
}

function lsReadRange(from: string, to: string): Record<string, DayLog> {
	const out: Record<string, DayLog> = {};
	if (typeof localStorage === 'undefined') return out;
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (!key?.startsWith(LS_PREFIX)) continue;
		const date = key.slice(LS_PREFIX.length);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
		if (date < from || date > to) continue;
		const log = lsRead(date);
		if (log) out[date] = log;
	}
	return out;
}

export const remoteBackend: Storage = {
	async getDay(date) {
		try {
			const res = await fetch(`/api/day/${date}`);
			if (!res.ok) throw new Error(`GET /api/day/${date}: ${res.status}`);
			const log = (await res.json()) as DayLog;
			lsWrite(date, log);
			return log;
		} catch (err) {
			console.warn('[storage] getDay fallback to localStorage', err);
			return lsRead(date) ?? {};
		}
	},
	async setDay(date, log) {
		lsWrite(date, log);
		const res = await fetch(`/api/day/${date}`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(log)
		});
		if (!res.ok) throw new Error(`PUT /api/day/${date}: ${res.status}`);
	},
	async bump(date, exercise, delta) {
		const res = await fetch(`/api/day/${date}/bump`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ exercise, delta })
		});
		if (!res.ok) throw new Error(`POST /api/day/${date}/bump: ${res.status}`);
		const log = (await res.json()) as DayLog;
		lsWrite(date, log);
		return log;
	},
	async getRange(fromDate, toDate) {
		try {
			const res = await fetch(`/api/range?from=${fromDate}&to=${toDate}`);
			if (!res.ok) throw new Error(`GET /api/range: ${res.status}`);
			const data = (await res.json()) as Record<string, DayLog>;
			for (const [d, log] of Object.entries(data)) lsWrite(d, log);
			return data;
		} catch (err) {
			console.warn('[storage] getRange fallback to localStorage', err);
			return lsReadRange(fromDate, toDate);
		}
	}
};
