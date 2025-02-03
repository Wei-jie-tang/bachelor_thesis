<script lang="ts">
	import Details from '$lib/component/Details.svelte';
	import RegisterInterface from '$lib/component/registerInterface.svelte';
	import Overview from '$lib/component/Overview.svelte';
	import { status, address, resources } from '$lib/stores/self';
	import { selectedAsset } from '$lib/stores/details';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	type AssetObj = {
		[ID: string]: {
			owner: string;
			inheritors: string[];
			executors: string[];
		};
	};

	export let data: { assets: AssetObj; nodes: string[] };

	$: assets = data.assets
		? Object.keys(data.assets).map((ID, i) => {
				console.log(`Formatting loaded data...`);
				const asset = Object.values(data.assets)[i];
				const owner = asset.owner;
				const inheritors = asset.inheritors;
				const executors = asset.executors;
				return { ID, owner, inheritors, executors };
			})
		: [];

	function reloadData() {
		invalidateAll();
	}
</script>

<section>
	<div class="header">
		<h1>BRILLIANT</h1>
		<button on:click={reloadData}>Reload</button>
		<span class="subheadline {$status}">
			Node {$status}
			{#if $status === 'registered'}{$address}{/if}
		</span>
	</div>
</section>

<div class="flex-container">
	<section>
		<Overview {assets} nodes={data.nodes}></Overview>
	</section>
	<section>
		<Details details={data.assets[$selectedAsset]}></Details>
	</section>
	<section>
		<RegisterInterface></RegisterInterface>
	</section>
</div>

<style lang="scss">
	.flex-container {
		margin-top: 10px;
		display: flex;
		justify-content: space-evenly;
	}
	.header {
		position: relative;

		.subheadline {
			display: inline;
			font-weight: 200;
			font-size: 18px;
		}
	}

	.registered {
		color: green;
	}
	.pending {
		color: #b2a300;
	}
	.unregistered {
		color: red;
	}
	h1 {
		font-size: 32px;
		margin-bottom: 10px;
		display: inline;
	}
	section > * {
		width: 30%;
		margin-left: 10px;
	}
</style>
