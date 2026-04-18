<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { migrateLocalStorageOnce } from '$lib/migrate';

	let { children } = $props();

	const links = [
		{ href: '/', label: 'log' },
		{ href: '/today', label: 'today' }
	];

	onMount(() => {
		void migrateLocalStorageOnce();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>workout</title>
</svelte:head>

<div class="shell">
	<nav>
		{#each links as { href, label } (href)}
			<a {href} class:active={page.url.pathname === href}>{label}</a>
		{/each}
	</nav>
	<main>
		{@render children()}
	</main>
</div>

<style>
	:global(:root) {
		--bg: #0f1115;
		--card: #171a21;
		--border: #242834;
		--btn: #1f2430;
		--btn-active: #2a3040;
		--muted: #8a92a5;
		--accent: #6ea8ff;
		color-scheme: dark;
	}
	:global(body) {
		margin: 0;
		background: var(--bg);
		color: #e9ecf2;
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
	}
	nav {
		display: flex;
		gap: 1rem;
		padding: 0.9rem 1rem;
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		background: var(--bg);
		z-index: 1;
	}
	nav a {
		color: var(--muted);
		text-decoration: none;
		font-size: 0.95rem;
		padding: 0.2rem 0.4rem;
		border-radius: 6px;
	}
	nav a.active {
		color: #e9ecf2;
		background: var(--card);
	}
	main {
		padding: 1rem;
		flex: 1;
	}
	@media (min-width: 720px) {
		main {
			padding: 1.5rem 2rem;
		}
	}
</style>
