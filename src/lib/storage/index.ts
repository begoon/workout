import { localStorageBackend } from './local';
import type { Storage } from './types';

export const storage: Storage = localStorageBackend;
export type { DayLog, Storage } from './types';
export { todayISO, addDays } from './types';
