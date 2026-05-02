let count = $state(0);

export const busy = {
	get active() {
		return count > 0;
	}
};

export async function track<T>(promise: Promise<T>): Promise<T> {
	count++;
	try {
		return await promise;
	} finally {
		count--;
	}
}
