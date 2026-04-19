<script lang="ts">
	import { storage, todayISO, type DayLog } from '$lib/storage';
	import { excColor } from '$lib/colors';

	let { date }: { date: string } = $props();

	const today = todayISO();
	let log = $state<DayLog>({});
	let exercises = $state<string[]>([]);
	let loaded = $state(false);

	$effect(() => {
		loaded = false;
		void (async () => {
			try {
				const [d, list] = await Promise.all([storage.getDay(date), storage.getExercises()]);
				log = d;
				exercises = list;
				loaded = true;
			} catch (err) {
				alert(`Failed to load ${date}\n${err instanceof Error ? err.message : String(err)}`);
			}
		})();
	});

	const label = $derived.by(() => {
		if (date === today) return 'Today';
		const [y, m, d] = date.split('-').map(Number);
		const dt = new Date(y, m - 1, d);
		return dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
	});

	async function bump(exc: string, delta: number) {
		const prev = log;
		const optimistic = Math.max(0, (log[exc] ?? 0) + delta);
		log = { ...log, [exc]: optimistic };
		try {
			log = await storage.bump(date, exc, delta);
		} catch (err) {
			log = prev;
			alert(`Failed to save\n${err instanceof Error ? err.message : String(err)}`);
		}
	}
</script>

<section class="day-editor">
	<header>
		<h1>{label}</h1>
		<time>{date}</time>
	</header>

	{#if loaded}
		<ul class="list">
			{#each exercises as exc (exc)}
				{@const n = log[exc] ?? 0}
				<li class:active={n > 0} style="--exc-color:{excColor(exc)}">
					<span class="dot"></span>
					<span class="name">{exc}</span>
					<span class="count">{n}</span>
					<div class="buttons">
						<button type="button" onclick={() => bump(exc, -1)} aria-label={`decrement ${exc}`}>−</button>
						<button type="button" onclick={() => bump(exc, 1)} aria-label={`increment ${exc}`}>+</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.day-editor {
		max-width: 520px;
		margin: 0 auto;
	}
	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	time {
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	li {
		display: grid;
		grid-template-columns: auto 1fr auto auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.9rem 1rem;
		background: var(--card);
		border-radius: 12px;
		border: 1px solid var(--border);
		border-left: 4px solid var(--exc-color);
	}
	li.active {
		background: color-mix(in srgb, var(--exc-color) 14%, var(--card));
		border-color: color-mix(in srgb, var(--exc-color) 40%, var(--border));
		border-left-color: var(--exc-color);
	}
	li.active .count {
		color: var(--exc-color);
	}
	.dot {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: var(--exc-color);
	}
	.name {
		font-size: 1.05rem;
		text-transform: lowercase;
	}
	.count {
		font-size: 1.4rem;
		font-variant-numeric: tabular-nums;
		min-width: 2.5ch;
		text-align: right;
	}
	.buttons {
		display: flex;
		gap: 0.5rem;
	}
	button {
		width: 2.8rem;
		height: 2.8rem;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--btn);
		color: inherit;
		font-size: 1.3rem;
		cursor: pointer;
		touch-action: manipulation;
	}
	button:active {
		background: var(--btn-active);
	}
</style>
