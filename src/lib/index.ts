export const N = 8;
export const L = 4;
export const C = 1000;

export interface SQUARE {
	id: number;
	word: string;
	bob: boolean;
	shake: boolean;
	fade: boolean;
}

export interface INFO {
	board: string[];
	selected: number[];
	solved: number[];
	mistakes: number;
	user: string;
	count: number;
	flag?: string;
}

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
