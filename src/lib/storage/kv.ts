import type { Storage } from './types';

// Stub for Vercel KV. Wire up @vercel/kv here when moving off localStorage.
// Key layout: `workout:<YYYY-MM-DD>` -> JSON-encoded DayLog.
export const kvBackend: Storage = {
	async getDay() {
		throw new Error('KV backend not implemented yet');
	},
	async setDay() {
		throw new Error('KV backend not implemented yet');
	},
	async getRange() {
		throw new Error('KV backend not implemented yet');
	}
};
