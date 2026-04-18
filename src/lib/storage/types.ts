export type DayLog = Record<string, number>;

export interface Storage {
	getDay(date: string): Promise<DayLog>;
	setDay(date: string, log: DayLog): Promise<void>;
	getRange(fromDate: string, toDate: string): Promise<Record<string, DayLog>>;
}

export function todayISO(d = new Date()): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function addDays(date: string, delta: number): string {
	const [y, m, d] = date.split('-').map(Number);
	const dt = new Date(y, m - 1, d);
	dt.setDate(dt.getDate() + delta);
	return todayISO(dt);
}
