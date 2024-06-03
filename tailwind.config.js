/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				cell: {
					0: '#EFEFE6',
					1: '#5A594E',
					2: '#82837A'
				}
			}
		}
	},
	plugins: []
};
