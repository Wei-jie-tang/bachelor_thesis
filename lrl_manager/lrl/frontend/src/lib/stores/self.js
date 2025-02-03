import { readable, writable } from 'svelte/store';
// import { lrl_app } from '$lib/urls';

export const status = writable('unregistered');
// export const status = readable('unregistered', function start(set) {
// const interval = setInterval(() => {
// fetch(lrl_app + 'self/status')
// .then(async (res) => {
// const data = await res.json();
// console.log(`Setting Store Status: ${data.status}`);
// set(data.status);
// })
// .catch((err) => {
// console.error(`Error fetching Status: ${err.message}`);
// console.log('Trying again in 1 second');
// });
// }, 1000);

// return function stop() {
// clearInterval(interval);
// };
// });
export const address = writable('0x');
// export const address = readable('0x', function start(set) {
// const interval = setInterval(() => {
// fetch(lrl_app + 'self/address')
// .then(async (res) => {
// if (res.status === 204) {
// const data = await res.json();
// console.error(`Node not yet registered. Status: ${data.status}`);
// } else {
// const data = await res.json();
// console.log(`Setting Store Address: ${data.data}`);
// set(data.data);
// }
// })
// .catch((err) => {
// console.error(`Error fetching address: ${err.message}`);
// console.log('Trying again in 1 second');
// });
// }, 1000);

// return function stop() {
// clearInterval(interval);
// };
// });

export const resources = readable({}, function start(set) {
	const interval = setInterval(() => {
		fetch('/self/resources')
			.then(async (res) => {
				if (res.status === 204) {
					console.error(`Node not yet registered. Status: ${await res.text()}`);
				} else {
					clearInterval(interval);
					const data = await res.json();
					console.log(`Setting Store Resources: ${data.data}`);
					set(data.data);
				}
			})
			.catch((err) => {
				console.error(`Error fetching resources: ${err.message}`);
				console.log('Trying again in 1 second');
			});
	}, 1000);
});
