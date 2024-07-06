import jwt from 'jsonwebtoken';
import { parse, serialize } from 'cookie';
import { createHash } from 'crypto';

import { N, type INFO } from '$lib';
import { categories } from '$lib/server';
import { JWT_SECRET, FLAG_SECRET } from '$env/static/private';

export const POST = async ({ request }) => {
	let info: INFO;

	const cookies = parse(request.headers.get('cookie') || '');
	if (!cookies || !cookies.auth) {
		return new Response(JSON.stringify({ error: 'Missing board state' }), { status: 404 });
	} else {
		const token = cookies.auth;
		try {
			info = jwt.verify(token, JWT_SECRET) as INFO;
		} catch {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
		}
	}

	if (info.mistakes == 0) {
		return new Response(JSON.stringify({ error: 'No guesses left!' }), { status: 404 });
	}

	if (info.selected.length != N) {
		return new Response(JSON.stringify({ error: 'Cannot guess now!' }), { status: 404 });
	}

	let correct = -1;

	for (let i = 0; i < N; i++) {
		let ok = true;
		for (let j = 0; j < N; j++) {
			if (info.board[info.selected[j]] != categories[i]) ok = false;
		}

		if (ok == true) {
			correct = i;
		}
	}

	if (correct == -1) {
		info.mistakes -= 1;
	} else {
		for (let i = 0; i < N; i++) {
			const a = info.board[info.selected[i]];
			const b = info.board[N * info.solved.length + i];

			info.board[info.selected[i]] = b;
			info.board[N * info.solved.length + i] = a;

			info.selected = info.selected.map((select) =>
				select == info.solved.length * N + i ? info.selected[i] : select
			);
		}
		info.solved.push(correct);
	}

	info.selected = [];

	if (info.solved.length == N) {
		info.flag = createHash('sha256').update(`${info.user}_${FLAG_SECRET}`).digest('hex');
	}

	const response = { solved: info.solved };

	const newToken = jwt.sign(info, JWT_SECRET);
	const cookie = serialize('auth', newToken, {
		maxAge: 60 * 60,
		path: '/'
	});

	return new Response(JSON.stringify(response), {
		headers: {
			'Set-Cookie': cookie
		}
	});
};
