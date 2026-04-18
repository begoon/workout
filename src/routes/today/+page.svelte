<script lang="ts">
	import DayEditor from '$lib/DayEditor.svelte';
	import { todayISO } from '$lib/storage';
</script>

<DayEditor date={todayISO()} />
