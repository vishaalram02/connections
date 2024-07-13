import jwt from 'jsonwebtoken';

import { N, C, type INFO } from '$lib';
import { parse, serialize } from 'cookie';
import { JWT_SECRET } from '$env/static/private';
import { emojis } from '$lib/server';

export const POST = async ({ request }) => {
	const req = await request.json();
	let info: INFO;

	const cookies = parse(request.headers.get('cookie') || '');
	if (!cookies || !cookies.auth) {
		return new Response(JSON.stringify({ error: 'Missing board state' }), { status: 400 });
	} else {
		const token = cookies.auth;
		try {
			info = jwt.verify(token, JWT_SECRET) as INFO;
		} catch {
			return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400 });
		}
	}

	if (req.guess === undefined) {
		return new Response(JSON.stringify({ error: 'Missing guess!' }), { status: 400 });
	}

	if (
		typeof req.guess != 'number' ||
		!Number.isInteger(req.guess) ||
		(req.guess != -1 && req.guess < info.solved.length * N) ||
		req.guess >= N * N
	) {
		return new Response(JSON.stringify({ error: 'Invalid guess' }), { status: 400 });
	}

	if (info.count > C) {
		return new Response(
			JSON.stringify({ error: "You're not very good at this. Restart and try again 😈" }),
			{ status: 406 }
		);
	}

	info.count += 1;
	const guess = req.guess;
	const x = Math.floor(guess / N),
		y = guess % N;

	if (req.guess == -1) {
		info.selected = [];
	} else if (info.selected.includes(guess)) {
		info.selected = info.selected.filter((value) => value != guess);
	} else {
		if (info.selected.length >= N) {
			return new Response(JSON.stringify({ error: 'Too many selected' }), { status: 400 });
		}

		info.selected.push(guess);

		const words: number[] = info.board.map((word) => emojis.indexOf(word));

		for (let i = info.solved.length * N; i < N * N; i++) {
			if (info.selected.includes(i)) continue;
			const word = words[i];
			if (((word >> x) & 1) == ((word >> y) & 1)) continue;
			words[i] ^= (1 << x) | (1 << y);
		}

		info.board = words.map((word) => emojis[word]);
	}

	const response = { selected: info.selected, board: info.board };

	const newToken = jwt.sign(info, JWT_SECRET);
	const cookie = serialize('auth', newToken, {
		maxAge: 24 * 60 * 60,
		path: '/'
	});

	return new Response(JSON.stringify(response), {
		headers: {
			'Set-Cookie': cookie
		}
	});
};
