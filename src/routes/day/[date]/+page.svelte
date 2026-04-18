<script lang="ts">
	import { page } from '$app/state';
	import DayEditor from '$lib/DayEditor.svelte';
</script>

{#key page.params.date}
	<DayEditor date={page.params.date ?? ''} />
{/key}
