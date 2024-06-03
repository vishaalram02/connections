import { N } from '$lib';
import { parse, serialize } from 'cookie';
import jwt from 'jsonwebtoken';
import { SECRET, FLAG } from '$env/static/private';
import { type INFO } from '$lib/utils';

let solutions: number[][] = [];

for (let i = 0; i < N; i++) {
	solutions.push([]);
	for (let j = 0; j < N; j++) {
		solutions[i].push(i * N + j);
	}
}

export const POST = async ({ request }) => {
	let req = await request.json();
	let info: INFO;

	const cookies = parse(request.headers.get('cookie') || '');
	if (!cookies || !cookies.auth) {
		info = {
			solved: [],
			mistakes: 100
		};
	} else {
		const token = cookies.auth;
		try {
			info = jwt.verify(token, SECRET) as INFO;
		} catch (e) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
		}
	}

	if (info.mistakes < 0) {
		return new Response(JSON.stringify({ error: 'No guesses left!' }), { status: 401 });
	}

	let missing = N;
	let solve = -1;
	for (let i = 0; i < N; i++) {
		let intersection = req.guess.filter((value: number) => solutions[i].includes(value));
		missing = Math.min(N - intersection.length, missing);

		if (missing === 0) {
			solve = i;
			break;
		}
	}

	if (solve == -1) {
		info.mistakes -= 1;
	} else if (!info.solved.includes(solve)) info.solved.push(solve);

	let response: any = { solve, missing };
	let data: any = { solved: info.solved, mistakes: info.mistakes };

	if (info.solved.length == N) {
		response.flag = FLAG;
		data.flag = FLAG;
	}

	const newToken = jwt.sign(data, SECRET, { expiresIn: '1h' });
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
