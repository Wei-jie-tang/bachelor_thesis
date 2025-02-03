import { backend } from '$lib/urls.js';
type AssetObj = {
	[ID: number]: {
		owner: string;
		inheritors: string[];
		executors: string[];
	};
};
// const dummyData: { assets: AssetObj; nodes: string[] } = {
// 	assets: {
// 		'1': {
// 			owner: '0x58e4f15faf53a7ffed3fd663f680fc41f6dd9602',
// 			inheritors: ['0x1acebfbcfa3e48646ed4b31373e506ef0583f422'],
// 			executors: ['0xe7af2fba4a487074af08cfbda19982b8d895f306']
// 		},
// 		'3': {
// 			owner: '0xa6448cb3125f7d6f5bf065ec88b09c6bede71133',
// 			inheritors: [
// 				'0xfffa5db50e893c606ffff77c4b84f281074130f7',
// 				'0xb19f005525199d0d5c983e6297d3c029559ba0c6'
// 			],
// 			executors: [
// 				'0x58a062532f1cc836aad53d795001698cc3b75b3c',
// 				'0xa48f774f47416e3cb8bdaf1e8d67e9ab9be590d2'
// 			]
// 		},
// 		'6': {
// 			owner: '0xa48f774f47416e3cb8bdaf1e8d67e9ab9be590d2',
// 			inheritors: [
// 				'0xaf5252443368f23b0070d66741e4e2d46dbce771',

// 				'0x2aca247bb4d65bed424f7f7e67f549f5091d1d35'
// 			],
// 			executors: [
// 				'0x58a062532f1cc836aad53d795001698cc3b75b3c',
// 				'0xb19f005525199d0d5c983e6297d3c029559ba0c6'
// 			]
// 		}
// 	},
// 	nodes: [
// 		'0x58e4f15faf53a7ffed3fd663f680fc41f6dd9602',
// 		'0x1acebfbcfa3e48646ed4b31373e506ef0583f422',
// 		'0xe7af2fba4a487074af08cfbda19982b8d895f306',
// 		'0xa6448cb3125f7d6f5bf065ec88b09c6bede71133',
// 		'0xfffa5db50e893c606ffff77c4b84f281074130f7',
// 		'0xb19f005525199d0d5c983e6297d3c029559ba0c6',
// 		'0x58a062532f1cc836aad53d795001698cc3b75b3c',
// 		'0xa48f774f47416e3cb8bdaf1e8d67e9ab9be590d2',
// 		'0xaf5252443368f23b0070d66741e4e2d46dbce771',
// 		'0x2aca247bb4d65bed424f7f7e67f549f5091d1d35'
// 	]
// };

export async function load() {
	// GET all assets (+owner 4free)

	const assets: AssetObj = {};
	const res_assets = await fetch(backend + 'events/pastEvents/NewAsset');
	const res_nodes = await fetch(backend + 'events/pastEvents/NewNode');
	if (res_assets.status === 500) {
		console.log(`Something went wrong while loading assets data: ${await res_assets.text()}`);
	}
	if (res_nodes.status === 500) {
		console.log(`Something went wrong while loading nodes data: ${await res_nodes.text()}`);
	}

	const assetEvents: {
		event: string;
		returnValues: {
			ID: number;
			owner: string;
		};
		raw: { topics: (string | number)[] };
	}[] = (await res_assets.json()).events;
	console.log(
		`Loading ${assetEvents.length} 'NewAsset' ${assetEvents.length === 1 ? 'event' : 'events'}`
	);

	for (const event of assetEvents) {
		const assetID = Number(event.returnValues.ID);
		const firstOwner = event.returnValues.owner;

		const res_transfer = await fetch(
			backend + 'events/pastEvents/Transfer/filter/_tokenId/' + assetID
		);
		let currentOwner;
		const transferEvents = (await res_transfer.json()).events;
		if (transferEvents.length === 0) {
			console.log(`Asset #${assetID} has never been transfered`);
			currentOwner = firstOwner;
		} else {
			const lastTransfer = transferEvents[transferEvents.length - 1];
			console.log(
				`Latest transfer: \n${lastTransfer.returnValues._from} -> ${lastTransfer.returnValues._to}`
			);
			currentOwner = lastTransfer.returnValues._to;
			console.log(`Asset #${assetID} has been transfered to ${currentOwner}`);
		}

		console.log(`Loading: Asset #${assetID}, Owner: ${currentOwner}`);

		// GET inheritors by ID
		const res_inheritors = await fetch(
			backend + `events/pastEvents/InheritorChosen/filter/assetID/${assetID}`
		);
		const inheritorEvents: {
			event: string;
			returnValues: { inheritor: string; assetID: number };
			raw: { topics: (string | number)[] };
		}[] = (await res_inheritors.json()).events;
		console.log(
			`Loading ${inheritorEvents.length} 'InheritorChosen' ${inheritorEvents.length === 1 ? 'event' : 'events'}`
		);

		const inheritors = inheritorEvents.map((event) => event.returnValues.inheritor);

		// GET executors by ID
		// const executors = [];
		const res_executors = await fetch(
			backend + `events/pastEvents/ExecutorChosen/filter/assetID/${assetID}`
		);
		const executorEvents: {
			event: string;
			returnValues: { executor: string; assetID: number };
			raw: { topics: (string | number)[] };
		}[] = (await res_executors.json()).events;
		console.log(
			`Loading ${executorEvents.length} 'ExecutorChosen' ${executorEvents.length === 1 ? 'event' : 'events'}`
		);

		const executors = executorEvents.map((event) => event.returnValues.executor);

		// Build assets OBJ
		// Object.defineProperty(assets, assetID, {
		// value: { owner: currentOwner, inheritors, executors }
		// });
		assets[assetID] = { owner: currentOwner, inheritors, executors };
	}
	console.log(`Assets loaded: \n${JSON.stringify(assets)}`);

	const nodeEvents: {
		event: 'NewNode';
		returnValues: {
			addr: string;
			IP: string;
			resources: { [resource: string]: number };
		};
		raw: { topics: string[] };
	}[] = (await res_nodes.json()).events;

	console.log(
		`Loading ${nodeEvents.length} 'NewNode' ${nodeEvents.length === 1 ? 'event' : 'events'}`
	);

	const nodes = nodeEvents.map((event) => event.returnValues.addr);
	console.log(`Loading nodes: \n${JSON.stringify(nodes)}`);
	//console.log(`Loading data: ${JSON.stringify({ assets, nodes })}`);
	return { assets, nodes };
	// return dummyData;
}

// export const actions = {
// registerAsset: async ({ request }) => {
// const data = await request.formData();

// fetch(backend + 'methods/registerAsset', {
// method: 'POST',
// headers: {
// 'Content-Type': 'application/json'
// },
// body: JSON.stringify({
// owner: data.get('address'),
// cores: data.get('cores'),
// speed: data.get('speed'),
// ram: data.get('ram'),
// bandwidth: data.get('bandwidth'),
// rtt: data.get('rtt')
// })
// });
// },
// registerNode: async ({ request }) => {
// const data = await request.formData();

// fetch(backend + 'methods/registerNode', {
// method: 'POST',
// headers: {
// 'Content-Type': 'application/json'
// },
// body: JSON.stringify({
// address: data.get('address'),
// cores: data.get('cores'),
// speed: data.get('speed'),
// ram: data.get('ram'),
// bandwidth: data.get('bandwidth'),
// rtt: data.get('rtt')
// })
// });
// }
// };
