import { redirect, type RequestHandler } from '@sveltejs/kit';
import { AUTH_COOKIE } from '$lib/server/auth';

const clear: RequestHandler = ({ cookies }) => {
	cookies.delete(AUTH_COOKIE, { path: '/' });
	redirect(303, '/login');
};

export const GET = clear;
export const POST = clear;
