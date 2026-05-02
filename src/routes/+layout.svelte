<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { version } from '$app/environment';
	import { busy } from '$lib/busy.svelte';

	let { children } = $props();

	const links = [
		{ href: '/', label: 'log' },
		{ href: '/today', label: 'today' },
		{ href: '/exercises', label: 'exercises' }
	];

	const isLogin = $derived(page.url.pathname === '/login');

	let theme = $state<'light' | 'dark'>('light');
	let updateReady = $state(false);
	let waitingWorker: ServiceWorker | null = null;

	onMount(() => {
		const current = document.documentElement.getAttribute('data-theme');
		theme = current === 'dark' ? 'dark' : 'light';

		if (!('serviceWorker' in navigator)) return;

		const standalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;
		if (!standalone) return;

		let reloaded = false;
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			if (reloaded) return;
			reloaded = true;
			location.reload();
		});

		let cleanup = () => {};

		navigator.serviceWorker.ready.then((reg) => {
			const announce = (worker: ServiceWorker | null) => {
				if (!worker || !navigator.serviceWorker.controller) return;
				if (worker.state === 'installed') {
					waitingWorker = worker;
					updateReady = true;
				}
			};

			const onUpdateFound = () => {
				const worker = reg.installing;
				if (!worker) return;
				worker.addEventListener('statechange', () => announce(worker));
			};

			reg.addEventListener('updatefound', onUpdateFound);
			announce(reg.waiting);

			const check = () => {
				reg.update().catch(() => {});
			};
			const onVisibility = () => {
				if (document.visibilityState === 'visible') check();
			};
			document.addEventListener('visibilitychange', onVisibility);
			check();

			cleanup = () => {
				reg.removeEventListener('updatefound', onUpdateFound);
				document.removeEventListener('visibilitychange', onVisibility);
			};
		});

		return () => cleanup();
	});

	function applyUpdate() {
		waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
	}

	function toggleTheme() {
		const next: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark';
		theme = next;
		document.documentElement.setAttribute('data-theme', next);
		try {
			localStorage.setItem('workout-theme', next);
		} catch (e) {
			// ignore
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
	{#if !isLogin}
		<nav>
			<div class="links">
				{#each links as { href, label } (href)}
					<a {href} class:active={page.url.pathname === href}>{label}</a>
				{/each}
			</div>
			<div class="right">
				{#if updateReady}
					<button type="button" class="update" onclick={applyUpdate} title="Reload to apply update">
						update
					</button>
				{/if}
				<span class="commit" title="build {version}">{version}</span>
				<button
					type="button"
					class="theme"
					onclick={toggleTheme}
					title="Switch theme"
					aria-label="Switch to {theme === 'dark' ? 'light' : 'dark'} mode"
				>
					{#if theme === 'dark'}
						<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
							<circle cx="12" cy="12" r="4" fill="currentColor" />
							<g stroke="currentColor" stroke-width="2" stroke-linecap="round">
								<line x1="12" y1="2" x2="12" y2="5" />
								<line x1="12" y1="19" x2="12" y2="22" />
								<line x1="2" y1="12" x2="5" y2="12" />
								<line x1="19" y1="12" x2="22" y2="12" />
								<line x1="4.5" y1="4.5" x2="6.6" y2="6.6" />
								<line x1="17.4" y1="17.4" x2="19.5" y2="19.5" />
								<line x1="4.5" y1="19.5" x2="6.6" y2="17.4" />
								<line x1="17.4" y1="6.6" x2="19.5" y2="4.5" />
							</g>
						</svg>
					{:else}
						<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
							<path
								d="M21 13.5A9 9 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5z"
								fill="currentColor"
							/>
						</svg>
					{/if}
				</button>
				<a class="logout" href="/logout" data-sveltekit-reload>logout</a>
			</div>
		</nav>
	{/if}
	<main>
		{@render children()}
	</main>
</div>

{#if busy.active}
	<div class="busy-overlay" role="status" aria-live="polite">
		<div class="busy-text">updating…</div>
	</div>
{/if}

<style>
	:global(:root[data-theme='dark']) {
		--bg: #0f1115;
		--card: #171a21;
		--card-alt: #1c2029;
		--border: #242834;
		--btn: #1f2430;
		--btn-active: #2a3040;
		--text: #e9ecf2;
		--muted: #8a92a5;
		--accent: #6ea8ff;
		--danger: #f08080;
		color-scheme: dark;
	}
	:global(:root[data-theme='light']) {
		--bg: #f6f7fa;
		--card: #ffffff;
		--card-alt: #eef0f6;
		--border: #d9dde5;
		--btn: #eef0f6;
		--btn-active: #dee2ec;
		--text: #1a1d24;
		--muted: #6a7286;
		--accent: #2a63c4;
		--danger: #c44040;
		color-scheme: light;
	}
	:global(body) {
		margin: 0;
		background: var(--bg);
		color: var(--text);
		font-family:
			ui-sans-serif,
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			sans-serif;
	}
	.shell {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding-top: env(safe-area-inset-top);
		padding-bottom: env(safe-area-inset-bottom);
	}
	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem max(1rem, env(safe-area-inset-left)) 0.9rem max(1rem, env(safe-area-inset-right));
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: env(safe-area-inset-top);
		background: var(--bg);
		z-index: 1;
	}
	.links {
		display: flex;
		gap: 1rem;
	}
	.right {
		display: flex;
		gap: 0.7rem;
		align-items: center;
	}
	nav a {
		color: var(--muted);
		text-decoration: none;
		font-size: 0.95rem;
		padding: 0.2rem 0.4rem;
		border-radius: 6px;
	}
	nav a.active {
		color: var(--text);
		background: var(--card);
	}
	.logout {
		font-size: 0.85rem;
	}
	.commit {
		font-size: 0.75rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
		font-family: ui-monospace, SFMono-Regular, monospace;
		opacity: 0.7;
	}
	.theme {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--muted);
		background: transparent;
		border: 1px solid var(--border);
		padding: 0.25rem;
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 6px;
		cursor: pointer;
		font-family: inherit;
	}
	.theme:hover {
		color: var(--text);
		border-color: var(--accent);
	}
	.update {
		font-size: 0.85rem;
		color: var(--bg);
		background: var(--accent);
		border: 1px solid var(--accent);
		padding: 0.2rem 0.6rem;
		border-radius: 6px;
		cursor: pointer;
		font-family: inherit;
	}
	main {
		padding: 1rem max(1rem, env(safe-area-inset-right)) 1rem max(1rem, env(safe-area-inset-left));
		flex: 1;
	}
	@media (min-width: 720px) {
		main {
			padding: 1.5rem 2rem;
		}
	}
	.busy-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(2px);
		animation: busy-fade 0.15s ease-out;
	}
	.busy-text {
		color: white;
		font-size: 1.6rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		padding: 1.2rem 2rem;
		border-radius: 14px;
		background: color-mix(in srgb, var(--accent) 30%, rgba(0, 0, 0, 0.6));
		border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}
	@keyframes busy-fade {
		from { opacity: 0; }
		to { opacity: 1; }
	}
</style>
