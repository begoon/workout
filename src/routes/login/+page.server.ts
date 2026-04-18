import { fail, redirect, type Actions } from '@sveltejs/kit';
import { AUTH_COOKIE, COOKIE_MAX_AGE, issueAuthToken, verifyPassword } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const password = data.get('password');
		if (typeof password !== 'string' || !verifyPassword(password)) {
			return fail(401, { error: 'wrong password' });
		}
		cookies.set(AUTH_COOKIE, issueAuthToken(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: COOKIE_MAX_AGE
		});
		const from = url.searchParams.get('from');
		const safe = from && from.startsWith('/') && !from.startsWith('/login') ? from : '/';
		redirect(303, safe);
	}
};
