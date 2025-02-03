import { backend } from '$lib/urls';

export async function POST({ request }) {
	const data = await request.formData();
	const assetID = Number(data.get('assetID'));
	const executor = data.get('address');
	const res = await fetch(backend + 'methods/setExecutor', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			assetID,
			executor
		})
	});

	return res;
}
