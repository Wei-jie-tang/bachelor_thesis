import { backend } from '$lib/urls';
import { json } from '@sveltejs/kit';
export async function GET({ params }) {
	console.log(`Fetching ${params.info}`);
	const res = await fetch(backend + `self/${params.info}`);
	const data = await res.json();
	//const response = json(res);
	console.log(`API RESPONSE: ${JSON.stringify(data)}`);
	return json(data);
}
