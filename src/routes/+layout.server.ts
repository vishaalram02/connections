import jwt from 'jsonwebtoken';
import seedrandom from 'seedrandom';

import type { LayoutServerLoad } from './$types';
import { emojis, vals } from '$lib/server';
import { N, L, type INFO } from '$lib';
import { JWT_SECRET } from '$env/static/private';

function shuffle(array: string[], rng: seedrandom.PRNG) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

export const load: LayoutServerLoad = ({ url, cookies }) => {
	const user = url.searchParams.get('u') ?? 'anonymous';
	const rng = seedrandom(user);

	const words: number[] = [];

	for (let i = 0; i < N; i++) {
		for (let j = 0; j < N; j++) {
			words.push(vals[i][Math.floor(rng() * vals[i].length)]);
		}
	}

	let token = cookies.get('auth');
	let data: INFO = {
		board: shuffle(
			words.map((word) => emojis[word]),
			rng
		),
		selected: [],
		solved: [],
		mistakes: L,
		count: 0,
		user: user
	};

	let reset = false;

	if (!token) {
		reset = true;
	} else {
		let info = jwt.decode(token) as INFO;
		if (info.user == user) data = info;
		else reset = true;
	}

	if (reset) {
		const newToken = jwt.sign(data, JWT_SECRET, { expiresIn: '1h' });

		cookies.set('auth', newToken, {
			path: '/',
			maxAge: 60 * 60,
			httpOnly: false
		});
	}

	return data;
};
