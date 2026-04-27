<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();

	const links = [
		{ href: '/', label: 'log' },
		{ href: '/today', label: 'today' },
		{ href: '/exercises', label: 'exercises' }
	];

	const isLogin = $derived(page.url.pathname === '/login');

	let theme = $state<'light' | 'dark'>('light');

	onMount(() => {
		const current = document.documentElement.getAttribute('data-theme');
		theme = current === 'dark' ? 'dark' : 'light';
	});

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
				<button
					type="button"
					class="theme"
					onclick={toggleTheme}
					title="Switch theme"
					aria-label="Switch to {theme === 'dark' ? 'light' : 'dark'} mode"
				>
					{theme === 'dark' ? 'light' : 'dark'}
				</button>
				<a class="logout" href="/logout" data-sveltekit-reload>logout</a>
			</div>
		</nav>
	{/if}
	<main>
		{@render children()}
	</main>
</div>

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
	.theme {
		font-size: 0.85rem;
		color: var(--muted);
		background: transparent;
		border: 1px solid var(--border);
		padding: 0.2rem 0.55rem;
		border-radius: 6px;
		cursor: pointer;
		font-family: inherit;
	}
	.theme:hover {
		color: var(--text);
		border-color: var(--accent);
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
</style>
