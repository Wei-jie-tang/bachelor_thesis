import { writable } from 'svelte/store';

export const selectedAsset = writable(0);
export const selectedNode = writable('');
