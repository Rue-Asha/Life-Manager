<script lang="ts">
	import type { IsoDate, Todo } from '$lib/types';

	let {}: { todos: Todo[]; sprintDays: IsoDate[]; today: IsoDate } = $props();
</script>
