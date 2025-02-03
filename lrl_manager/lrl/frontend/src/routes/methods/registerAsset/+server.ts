import { backend } from '$lib/urls.js';

export async function POST({ request }) {
	const data = await request.formData();

	let owner = data.get('address');
	if (owner?.toString().charAt(1) !== 'x') owner = '0x' + owner;

	const res = await fetch(backend + 'methods/registerAsset', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			owner,
			numExecutors: data.get('numExecutors'),
			threshold: data.get('threshold'),
			cores: data.get('cores'),
			speed: data.get('speed'),
			ram: data.get('ram'),
			bandwidth: data.get('bandwidth'),
			rtt: data.get('rtt')
		})
	});

	return res;
}
