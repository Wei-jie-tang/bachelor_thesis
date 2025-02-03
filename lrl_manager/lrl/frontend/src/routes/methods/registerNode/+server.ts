import { backend } from '$lib/urls.js';
/**
export async function GET() {
	const res = await fetch(backend + 'methods/registerNode');

	return json(res.body);
}
 */

export async function POST({ request }) {
	const data = await request.formData();

	let addr = data.get('address');
	if (addr?.toString().charAt(1) !== 'x') addr = '0x' + addr;
	const res = await fetch(backend + 'methods/registerNode', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			address: addr,
			cores: data.get('cores'),
			speed: data.get('speed'),
			ram: data.get('ram'),
			bandwidth: data.get('bandwidth'),
			rtt: data.get('rtt')
		})
	});

	return res;
}
