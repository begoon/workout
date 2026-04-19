import type { DayLog, Storage } from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, init);
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`${init?.method ?? 'GET'} ${url} → ${res.status}${text ? `: ${text}` : ''}`);
	}
	return (await res.json()) as T;
}

export const storage: Storage = {
	getDay: (date) => request<DayLog>(`/api/day/${date}`),
	bump: (date, exercise, delta) =>
		request<DayLog>(`/api/day/${date}/bump`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ exercise, delta })
		}),
	getRange: (from, to) => request<Record<string, DayLog>>(`/api/range?from=${from}&to=${to}`),
	getExercises: () => request<string[]>('/api/exercises'),
	setExercises: (list) =>
		request<string[]>('/api/exercises', {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(list)
		})
};

export type { DayLog, Storage } from './types';
export { todayISO, addDays } from './types';
