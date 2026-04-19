<script lang="ts">
	import { onMount } from 'svelte';
	import { storage } from '$lib/storage';
	import { MAX_NAME_LENGTH, NAME_RE, normalizeName } from '$lib/exercises';

	let list = $state<string[]>([]);
	let draft = $state('');
	let loaded = $state(false);
	let saving = $state(false);

	onMount(async () => {
		try {
			list = await storage.getExercises();
			loaded = true;
		} catch (err) {
			alert(`Failed to load exercises\n${err instanceof Error ? err.message : String(err)}`);
		}
	});

	async function commit(next: string[], prev: string[]) {
		saving = true;
		try {
			list = await storage.setExercises(next);
		} catch (err) {
			list = prev;
			alert(`Failed to save\n${err instanceof Error ? err.message : String(err)}`);
		} finally {
			saving = false;
		}
	}

	async function add() {
		const name = normalizeName(draft);
		if (!name) return;
		if (!NAME_RE.test(name)) {
			alert('name must be lowercase letters/digits, optionally with spaces, _ or -');
			return;
		}
		if (list.includes(name)) {
			draft = '';
			return;
		}
		const prev = list;
		const next = [...list, name];
		list = next;
		draft = '';
		await commit(next, prev);
	}

	async function remove(exc: string) {
		if (!confirm(`Remove "${exc}" from the list?\n(Historical data stays in past days.)`)) return;
		const prev = list;
		const next = list.filter((e) => e !== exc);
		list = next;
		await commit(next, prev);
	}

	async function move(exc: string, delta: -1 | 1) {
		const i = list.indexOf(exc);
		const j = i + delta;
		if (i < 0 || j < 0 || j >= list.length) return;
		const prev = list;
		const next = [...list];
		[next[i], next[j]] = [next[j], next[i]];
		list = next;
		await commit(next, prev);
	}
</script>

<svelte:head>
	<title>exercises — workout</title>
</svelte:head>

<section class="exercises">
	<header>
		<h1>Exercises</h1>
	</header>

	{#if loaded}
		<ul class="list">
			{#each list as exc, i (exc)}
				<li>
					<span class="name">{exc}</span>
					<div class="actions">
						<button type="button" onclick={() => move(exc, -1)} disabled={i === 0 || saving} aria-label="move up">↑</button>
						<button type="button" onclick={() => move(exc, 1)} disabled={i === list.length - 1 || saving} aria-label="move down">↓</button>
						<button type="button" class="remove" onclick={() => remove(exc)} disabled={saving} aria-label={`remove ${exc}`}>×</button>
					</div>
				</li>
			{/each}
		</ul>

		<form class="add" onsubmit={(e) => { e.preventDefault(); void add(); }}>
			<input
				type="text"
				bind:value={draft}
				placeholder="new exercise"
				maxlength={MAX_NAME_LENGTH}
				autocapitalize="off"
				autocorrect="off"
				spellcheck="false"
			/>
			<button type="submit" disabled={!draft.trim() || saving}>add</button>
		</form>
	{/if}
</section>

<style>
	.exercises {
		max-width: 520px;
		margin: 0 auto;
	}
	header {
		margin-bottom: 1.25rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.list {
		list-style: none;
		margin: 0 0 1.25rem;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.8rem 1rem;
		background: var(--card);
		border-radius: 12px;
		border: 1px solid var(--border);
	}
	.name {
		font-size: 1.05rem;
	}
	.actions {
		display: flex;
		gap: 0.35rem;
	}
	button {
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--btn);
		color: inherit;
		font-size: 1rem;
		cursor: pointer;
		touch-action: manipulation;
	}
	button:active:not(:disabled) {
		background: var(--btn-active);
	}
	button:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	button.remove {
		color: #f08080;
	}
	.add {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.6rem;
	}
	input {
		padding: 0.85rem 1rem;
		font-size: 1rem;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--card);
		color: inherit;
	}
	.add button {
		width: auto;
		height: auto;
		padding: 0 1.2rem;
		font-size: 0.95rem;
	}
</style>
