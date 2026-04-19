export const DEFAULT_EXERCISES: readonly string[] = ['chins', 'ohp', 'pushup', 'dips', 'curls'];

export const MAX_EXERCISES = 64;
export const MAX_NAME_LENGTH = 32;
export const NAME_RE = /^[a-z0-9][a-z0-9 _-]{0,31}$/;

export function normalizeName(input: string): string {
	return input.trim().toLowerCase();
}
