/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `workout-${version}`;
const ASSETS = [...build, ...files];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			await cache.addAll(ASSETS);
			await sw.skipWaiting();
		})()
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
			await sw.clients.claim();
		})()
	);
});

sw.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;

	const url = new URL(req.url);
	if (url.origin !== sw.location.origin) return;

	// Never cache API calls — they're user data and must always be fresh.
	if (url.pathname.startsWith('/api/')) return;

	// Cache-first for pre-cached build/static assets.
	if (ASSETS.includes(url.pathname)) {
		event.respondWith(
			(async () => {
				const cached = await caches.match(req);
				return cached ?? fetch(req);
			})()
		);
		return;
	}

	// Network-first for everything else (HTML pages); fall back to cache offline.
	event.respondWith(
		(async () => {
			try {
				const response = await fetch(req);
				if (response.ok && response.type === 'basic') {
					const cache = await caches.open(CACHE);
					cache.put(req, response.clone());
				}
				return response;
			} catch {
				const cached = await caches.match(req);
				if (cached) return cached;
				throw new Error('offline and no cached response');
			}
		})()
	);
});
