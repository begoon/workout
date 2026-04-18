<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();

	const links = [
		{ href: '/', label: 'log' },
		{ href: '/today', label: 'today' }
	];

	const isLogin = $derived(page.url.pathname === '/login');
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
			<a class="logout" href="/logout" data-sveltekit-reload>logout</a>
		</nav>
	{/if}
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
	.logout {
		font-size: 0.85rem;
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
