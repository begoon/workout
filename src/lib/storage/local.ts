import type { DayLog, Storage } from './types';

const PREFIX = 'workout:';

export const localStorageBackend: Storage = {
	async getDay(date) {
		if (typeof localStorage === 'undefined') return {};
		const raw = localStorage.getItem(PREFIX + date);
		return raw ? (JSON.parse(raw) as DayLog) : {};
	},
	async setDay(date, log) {
		if (typeof localStorage === 'undefined') return;
		const hasEntries = Object.values(log).some((n) => n > 0);
		if (hasEntries) {
			localStorage.setItem(PREFIX + date, JSON.stringify(log));
		} else {
			localStorage.removeItem(PREFIX + date);
		}
	},
	async getRange(fromDate, toDate) {
		const out: Record<string, DayLog> = {};
		if (typeof localStorage === 'undefined') return out;
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key?.startsWith(PREFIX)) continue;
			const date = key.slice(PREFIX.length);
			if (date < fromDate || date > toDate) continue;
			const raw = localStorage.getItem(key);
			if (raw) out[date] = JSON.parse(raw) as DayLog;
		}
		return out;
	}
};
