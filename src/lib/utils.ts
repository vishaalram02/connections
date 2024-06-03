import { jwtDecode } from 'jwt-decode';
import seedrandom from 'seedrandom';

export const rng = seedrandom('');

export interface INFO {
	solved: number[];
	mistakes: number;
	flag?: string;
}

export const getCookie = (name: string) => {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(';').shift();
};

export const decodeJWT = () => {
	const token = getCookie('auth');
	if (!token) return null;
	try {
		const decoded = jwtDecode(token);
		return decoded as INFO;
	} catch (e) {
		return null;
	}
};
