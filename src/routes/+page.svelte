<script lang="ts">
	import { N, L, colors, numbers, type SQUARE } from '$lib';
	import { scale, fade } from 'svelte/transition';

	export let data;

	let squares: SQUARE[] = Array.from({ length: N * N }, (_, i) => {
		return {
			id: i,
			word: data.board[i],
			bob: false,
			shake: false,
			fade: false
		};
	});

	let state = data.solved.length == N ? 1 : data.mistakes == 0 ? 2 : 0; // 0: playing, 1: win, 2: lose
	let mistakes: number = data.mistakes;
	let solved: number[] = data.solved;
	let active: number = -1;
	let selected: number[] = data.selected;
	let pending: boolean = false;
	let selecting: boolean = false;
	let flag: string = '';

	const restart = () => {
		document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		window.location.reload();
	};

	const _select = async (id: number) => {
		if (selected.length < N) active = id;

		const res = await fetch('/select', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ guess: id })
		});
		if (res.status != 200) return;
		const data = await res.json();

		selected = data.selected;
		for (let i = 0; i < N * N; i++) {
			if (squares[i].word != data.board[squares[i].id]) squares[i].fade = true;
		}

		await new Promise((resolve) => setTimeout(resolve, 250));

		for (let i = 0; i < N * N; i++) {
			squares[i].word = data.board[squares[i].id];
		}

		await new Promise((resolve) => setTimeout(resolve, 250));

		for (let i = 0; i < N * N; i++) squares[i].fade = false;
	};

	const _guess = async () => {
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
			}
		});
		if (res.status != 200) return;
		const data = await res.json();

		if (data.solved.length == solved.length) {
			for (let i = 0; i < N; i++) {
				squares[selected[i]].shake = true;
			}
			await new Promise((resolve) => setTimeout(resolve, 800));
			for (let i = 0; i < N; i++) {
				squares[selected[i]].shake = false;
			}

			selected = [];
			mistakes -= 1;

			return;
		}

		for (let i = 0; i < N; i++) {
			let a = squares.findIndex((square) => square.id == selected[i]);
			let b = squares.findIndex((square) => square.id == solved.length * N + i);

			squares[a].id = solved.length * N + i;
			squares[b].id = selected[i];

			selected = selected.map((select) => (select == solved.length * N + i ? selected[i] : select));
			selected[i] = solved.length * N + i;
		}

		await new Promise((resolve) => setTimeout(resolve, 500));

		selected = [];
		solved = data.solved;

		if (data.flag) flag = data.flag;
	};

	const guess = async () => {
		if (pending) return;
		pending = true;
		await _guess();

		if (mistakes == 0) {
			state = 2;
			await new Promise((resolve) => setTimeout(resolve, 1000));

			for (let i = 0; i < N * N; i++) {
				squares[i].word = '😈';
			}
			solved = [];
		} else if (solved.length == N) {
			state = 1;
			await new Promise((resolve) => setTimeout(resolve, 1000));

			for (let i = 0; i < N * N; i++) {
				squares[i].word = '🤑';
			}
			solved = [];
		}

		pending = false;
	};

	const select = async (id: number) => {
		if (pending) return;

		while (selecting) {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		selecting = true;
		await _select(id);
		selecting = false;
	};
</script>

<div class="flex flex-col items-center w-screen h-screen">
	<div class="text-4xl font-bold mt-12">😈 EVIL CONNECTIONS 😈</div>
	<div class="flex items-center h-16">
		<div class="rounded-lg py-2 px-3 text-xl">
			{#if state == 0}
				{`Create groups of ${numbers[0][N - 1]}!`}
			{:else if state == 1}
				congrats! {flag}
			{:else if state == 2}
				you lose :(
			{/if}
		</div>
	</div>
	<div style:width="var(--game-w)" style:height="var(--game-h)">
		{#each squares as square (square)}
			{@const include = selected.includes(square.id)}
			{@const x = Math.floor(square.id / N)}
			{@const y = square.id % N}
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
					class:scale-90={active == square.id}
					class:bg-cell-2={square.shake}
					class:bob={square.bob}
					class:shake={square.shake}
					disabled={state != 0}
					on:mousedown={() => select(square.id)}
					on:mouseup={() => (active = -1)}
					on:mouseleave={() => (active = -1)}
				>
					<div class="font-bold text-3xl" class:fade={square.fade}>
						{square.word}
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
	<div class="my-4 flex w-full h-6">
		{#if mistakes > 0}
			<div class="flex w-full" out:fade>
				<div class="w-1/2 text-right">Mistakes remaining:</div>
				<div class="w-1/2 flex items-center space-x-2 ml-3">
					{#each { length: L } as _, i (i)}
						{#if i < mistakes}
							<div class="bg-gray-600 rounded-full h-4 w-4" out:scale />
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>
	<div class="flex space-x-4">
		<button
			class="border rounded-full px-4 py-3 {pending || state != 0
				? 'border-gray-500 text-gray-500'
				: 'border-black'}"
			on:click={() => select(-1)}
			disabled={pending || state != 0}
		>
			Deselect All
		</button>

		<button class="border border-black rounded-full px-4 py-3" on:click={() => restart()}>
			Restart
		</button>

		<button
			class="border rounded-full px-4 py-3 {selected.length == N
				? 'bg-black text-white'
				: 'border-gray-500 text-gray-500'}"
			on:click={() => guess()}
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
