<script lang="ts">
	import { onMount } from 'svelte';
	import { addDays, storage, todayISO, type DayLog } from '$lib/storage';
	import { excColor } from '$lib/colors';

	const DAYS = 42;
	const today = todayISO();
	const from = addDays(today, -(DAYS - 1));

	let range = $state<Record<string, DayLog>>({});
	let loaded = $state(false);

	async function refresh() {
		try {
			range = await storage.getRange(from, today);
			loaded = true;
		} catch (err) {
			alert(`Failed to load log\n${err instanceof Error ? err.message : String(err)}`);
		}
	}

	onMount(() => {
		void refresh();
		const onVisible = () => {
			if (document.visibilityState === 'visible') void refresh();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => document.removeEventListener('visibilitychange', onVisible);
	});

	const days = Array.from({ length: DAYS }, (_, i) => addDays(today, -i));

	function entries(log: DayLog | undefined): Array<[string, number]> {
		if (!log) return [];
		return Object.entries(log).filter(([, n]) => n > 0);
	}

	function weekday(date: string): string {
		const [y, m, d] = date.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' });
	}
</script>

<section class="calendar">
	<header>
		<h1>Log</h1>
	</header>

	{#if loaded}
		<div class="grid">
			{#each days as date (date)}
				{@const log = range[date]}
				{@const items = entries(log)}
				<a
					class="day"
					href="/day/{date}"
					class:empty={items.length === 0}
					class:is-today={date === today}
					class:month-alt={Number(date.slice(5, 7)) % 2 === 0}
				>
					<time>{date.slice(5)} {weekday(date)}</time>
					{#if items.length}
						<ul>
							{#each items as [exc, n] (exc)}
								<li>
									<span class="name" style="color:{excColor(exc)}">{exc}</span>
									<b>{n}</b>
								</li>
							{/each}
						</ul>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</section>

<style>
	.calendar {
		max-width: 1100px;
		margin: 0 auto;
	}
	header {
		margin-bottom: 1.25rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 0.6rem;
	}
	.day {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.3rem 0.8rem;
		min-height: 40px;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		color: inherit;
		text-decoration: none;
		transition: transform 0.05s ease, border-color 0.15s ease;
	}
	.day:hover {
		border-color: var(--accent);
	}
	.day:active {
		transform: scale(0.98);
	}
	.day.month-alt {
		background: var(--card-alt);
	}
	.day.empty {
		opacity: 0.45;
	}
	.day.is-today {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, var(--card));
	}
	time {
		font-size: 0.8rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 0.9rem;
	}
	li {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.78rem;
		white-space: nowrap;
	}
	b {
		font-variant-numeric: tabular-nums;
	}
</style>
