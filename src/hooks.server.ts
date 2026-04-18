import { redirect, type Handle } from '@sveltejs/kit';
import { AUTH_COOKIE, isAuthCookieValid } from '$lib/server/auth';

const PUBLIC_PATHS = new Set([
	'/login',
	'/manifest.webmanifest',
	'/service-worker.js',
	'/favicon.svg',
	'/favicon.ico',
	'/icon.svg',
	'/icon-maskable.svg',
	'/apple-touch-icon.png'
]);

function isPublic(pathname: string): boolean {
	if (PUBLIC_PATHS.has(pathname)) return true;
	if (pathname.startsWith('/_app/')) return true;
	return false;
}

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const authed = isAuthCookieValid(event.cookies.get(AUTH_COOKIE));

	if (!authed && !isPublic(pathname)) {
		if (pathname.startsWith('/api/')) {
			return new Response('unauthorized', { status: 401 });
		}
		redirect(303, `/login?from=${encodeURIComponent(pathname)}`);
	}
	return resolve(event);
};
