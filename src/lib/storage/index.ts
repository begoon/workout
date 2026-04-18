import { remoteBackend } from './remote';
import type { Storage } from './types';

export const storage: Storage = remoteBackend;
export type { DayLog, Storage } from './types';
export { todayISO, addDays } from './types';
