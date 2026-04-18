<script lang="ts">
	let { form } = $props();
</script>

<svelte:head>
	<title>sign in — workout</title>
</svelte:head>

<form method="post" class="login" autocomplete="on">
	<h1>workout</h1>
	<input
		type="password"
		name="password"
		autocomplete="current-password"
		placeholder="password"
		aria-label="password"
	/>
	<button type="submit">enter</button>
	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
</form>

<style>
	.login {
		max-width: 320px;
		margin: 4rem auto 0;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		padding: 0 1rem;
	}
	h1 {
		margin: 0 0 0.6rem;
		font-size: 1.6rem;
		text-align: center;
	}
	input,
	button {
		padding: 0.9rem 1rem;
		font-size: 1rem;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--card);
		color: inherit;
	}
	button {
		background: var(--btn);
		cursor: pointer;
	}
	button:active {
		background: var(--btn-active);
	}
	.error {
		color: #f08080;
		margin: 0;
		text-align: center;
		font-size: 0.9rem;
	}
</style>
