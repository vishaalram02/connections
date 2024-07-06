import { N } from '$lib';

export const emojis = Array.from({ length: 256 }, (_, i) => i).map((i) =>
	String.fromCodePoint(0x1f400 + i)
);

export const vals = Array.from({ length: 8 }, (_, i) =>
	Array.from({ length: 256 }, (_, j) => j).filter(
		(n) => n.toString(2).replace(/0/g, '').length === i
	)
);

export const categories = Array.from({ length: N }, (_, i) => i).map((i) => emojis[(1 << i) - 1]);
