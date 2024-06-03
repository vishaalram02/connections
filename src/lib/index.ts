import { emojis } from './emojis';
import seedrandom from 'seedrandom';

export const N = 10;

export let rng = seedrandom('');

export let squares = Array.from({ length: N * N }, (_, i) => {
	return {
		id: i,
		x: Math.floor(i / N),
		y: i % N,
		word: emojis[Math.floor(rng() * emojis.length)],
		bob: false,
		shake: false,
		fade: false
	};
});

export const colors = [
	'bg-red-400',
	'bg-orange-400',
	'bg-yellow-400',
	'bg-lime-400',
	'bg-green-400',
	'bg-cyan-400',
	'bg-blue-400',
	'bg-indigo-400',
	'bg-purple-400',
	'bg-pink-400'
];

export const numbers = [
	['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
	['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'],
	['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN']
];
