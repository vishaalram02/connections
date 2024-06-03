<script lang="ts">
	import { onMount } from 'svelte';
	import { N, squares, colors, numbers, rng } from '$lib';
	import { emojis } from '$lib/emojis';
	import { decodeJWT } from '$lib/utils';

	let state = 0; // 0: playing, 1: win, 2: lose
	let mistakes: number = 100;
	let solved: number[] = [];
	let active: number = -1;
	let selected: number[] = [];
	let pending: boolean = false;
	let selecting: boolean = false;
	let missing: number = -1;
	let flag: string = '';

	onMount(() => {
		const jwtData = decodeJWT();
		if (jwtData) {
			mistakes = jwtData.mistakes;
			solved = jwtData.solved;

			for (let i = 0; i < N * N; i++) {
				const id = squares[i].id;
				squares[i].x = Math.floor(jwtData.board[id] / N);
				squares[i].y = jwtData.board[id] % N;
			}

			if (solved.length == N && jwtData.flag) {
				state = 1;
				flag = jwtData.flag;
			}
			if (mistakes < 0) state = 2;
		}
	});

	const restart = () => {
		document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		window.location.reload();
	};

	const select = async (i: number) => {
		if (pending) return;
		if (selected.length < N) active = i;

		if (selected.includes(i)) {
			selected = selected.filter((j) => j !== i);
			return;
		}

		if (selected.length >= N) return;

		while (selecting) {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		selecting = true;
		selected = [...selected, i];

		for (let j = 0; j < N * N; j++) {
			if (selected.includes(j)) continue;
			if (rng() > 0.3) continue;

			squares[j].fade = true;
		}

		await new Promise((resolve) => setTimeout(resolve, 250));

		for (let j = 0; j < N * N; j++) {
			if (squares[j].fade) squares[j].word = emojis[Math.floor(rng() * emojis.length)];
		}

		await new Promise((resolve) => setTimeout(resolve, 250));

		for (let j = 0; j < N * N; j++) {
			squares[j].fade = false;
		}

		selecting = false;
	};

	const guess = async () => {
		for (let i = 0; i < N; i++) {
			squares[selected[i]].bob = true;
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		await new Promise((resolve) => setTimeout(resolve, 500));

		for (let i = 0; i < N; i++) {
			squares[selected[i]].bob = false;
		}

		const res = await fetch('/guess', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ guess: selected })
		});

		if (res.status != 200) return;

		const data = await res.json();

		if (data.solve == -1) {
			for (let i = 0; i < N; i++) {
				squares[selected[i]].shake = true;
			}
			await new Promise((resolve) => setTimeout(resolve, 800));
			for (let i = 0; i < N; i++) {
				squares[selected[i]].shake = false;
			}

			selected = [];
			missing = data.missing;
			await new Promise((resolve) => setTimeout(resolve, 2000));
			missing = -1;

			if (mistakes == 0) state = 2;
			else mistakes -= 1;
			return;
		}

		for (let i = 0; i < N * N; i++) {
			const id = squares[i].id;
			squares[i].x = Math.floor(data.board[id] / N);
			squares[i].y = data.board[id] % N;
		}

		await new Promise((resolve) => setTimeout(resolve, 500));

		for (let i = 0; i < N; i++) {
			const idx = selected[i];
		}

		selected = [];
		solved = [...solved, data.solve];

		await new Promise((resolve) => setTimeout(resolve, 500));
		if (data.flag) flag = data.flag;
		if (solved.length == N) state = 1;
	};

	const submit = async () => {
		if (pending) return;
		pending = true;
		await guess();
		pending = false;
	};

	$: {
		if (state == 1) {
			solved = [];
			for (let i = 0; i < N * N; i++) {
				squares[i].word = '🤑';
			}
		} else if (state == 2) {
			solved = [];
			for (let i = 0; i < N * N; i++) {
				squares[i].word = '👿';
			}
		}
	}
</script>

<div class="flex flex-col items-center w-screen h-screen">
	<div class="text-4xl font-bold mt-12">😈 EVIL CONNECTIONS 😈</div>
	<div class="flex items-center h-16">
		<div
			class="rounded-lg py-2 px-3 {missing != -1
				? 'text-white bg-black opacity-0 invfade'
				: 'text-xl'}"
		>
			{#if state == 0}
				{missing != -1
					? `${numbers[1][missing - 1]} away...`
					: `Create groups of ${numbers[0][N - 1]}!`}
			{:else if state == 1}
				flag: {flag}
			{:else if state == 2}
				you lose :(
			{/if}
		</div>
	</div>
	<div style:width="var(--game-w)" style:height="var(--game-h)">
		{#each squares as { x, y, word, id, bob, shake, fade } (id)}
			{@const include = selected.includes(id)}
			<div
				style:width="calc(var(--game-w)/{N})"
				style:height="calc(var(--game-h)/{N})"
				class="p-1 absolute transition-all duration-300"
				class:z-50={include}
				style:transform={`translate(${y * 100}%, ${x * 100}%)`}
			>
				<button
					class="relative size-full rounded-md flex justify-center items-center transition bg-cell-0"
					class:bg-cell-1={include}
					class:text-white={include}
					class:scale-90={active == id}
					class:bg-cell-2={shake}
					class:bob
					class:shake
					disabled={state != 0}
					on:mousedown={() => select(id)}
					on:mouseup={() => (active = -1)}
					on:mouseleave={() => (active = -1)}
				>
					<div class="font-bold text-xl" class:fade>
						{word}
					</div>
				</button>
			</div>
		{/each}
		{#each solved as solve, i (solve)}
			<div
				class="p-1 relative z-10 bg-white"
				style:width="var(--game-w)"
				style:height="calc(var(--game-h)/{N})"
			>
				<div
					class="flex size-full rounded-md justify-center items-center {colors[solve]}"
					class:pop={i == solved.length - 1}
				>
					<div class="text-xl font-bold">
						GROUP {numbers[2][solve]}
					</div>
				</div>
			</div>
		{/each}
	</div>
	<div class="text-lg my-4">
		Mistakes remaining: {mistakes}
	</div>
	<div class="flex space-x-4">
		<button
			class="border rounded-full px-4 py-3 {pending
				? 'border-gray-500 text-gray-500'
				: 'border-black'}"
			on:click={() => (selected = [])}
			disabled={pending}
		>
			Desellect All
		</button>

		<button class="border border-black rounded-full px-4 py-3" on:click={() => restart()}>
			Restart
		</button>

		<button
			class="border rounded-full px-4 py-3 {selected.length == N
				? 'bg-black text-white'
				: 'border-gray-500 text-gray-500'}"
			on:click={() => submit()}
			disabled={state != 0 || selected.length != N}
		>
			Submit
		</button>
	</div>
</div>

<style>
	@keyframes bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10%);
		}
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20%,
		60% {
			transform: translateX(-5%);
		}
		40%,
		80% {
			transform: translateX(5%);
		}
	}

	@keyframes pop {
		0%,
		100% {
			transform: scale(100%);
		}
		50% {
			transform: scale(110%);
		}
	}

	@keyframes fade {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}

	@keyframes invfade {
		0%,
		100% {
			opacity: 0;
		}
		75% {
			opacity: 1;
		}
	}

	.bob {
		animation: bob 0.4s 1;
	}

	.shake {
		animation: shake 0.5s 1;
	}

	.pop {
		animation: pop 0.5s 1;
	}

	.fade {
		animation: fade 0.5s 1;
	}

	.invfade {
		animation: invfade 2s 1;
	}
</style>
