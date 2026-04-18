import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const USER = env.BASIC_AUTH_USER ?? 'me';
const PASS = env.BASIC_AUTH_PASS ?? 'em';
const REALM = 'workout';

export const handle: Handle = async ({ event, resolve }) => {
	const header = event.request.headers.get('authorization');
	if (!header?.startsWith('Basic ')) {
		return unauthorized();
	}
	const decoded = atob(header.slice(6));
	const sep = decoded.indexOf(':');
	const user = decoded.slice(0, sep);
	const pass = decoded.slice(sep + 1);
	if (user !== USER || pass !== PASS) {
		return unauthorized();
	}
	return resolve(event);
};

function unauthorized() {
	return new Response('Authentication required', {
		status: 401,
		headers: { 'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"` }
	});
}
