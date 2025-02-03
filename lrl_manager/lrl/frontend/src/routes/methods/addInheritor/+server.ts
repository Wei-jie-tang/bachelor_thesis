import { backend } from '$lib/urls';

export async function POST({ request }) {
	const data = await request.formData();
	const assetID = Number(data.get('assetID'));
	const inheritor = data.get('address');
	const res = await fetch(backend + 'methods/setInheritor', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			assetID,
			inheritor
		})
	});

	return res;
}
