<script lang="ts">
	import BaseView from './BaseView.svelte';
	import { selectedAsset, selectedNode } from '$lib/stores/details';
	import '@fortawesome/fontawesome-free/css/all.min.css';

	export let assets: {
		ID: string;
		owner: string;
		inheritors: string[];
		executors: string[];
	}[];
	export let nodes: string[];

	let selected: 'assets' | 'nodes' = 'assets';
	$: table = {
		assets: {
			props: ['ID', 'Owner', 'Inheritors', 'Executors'],
			values: assets
		},
		nodes: {
			props: ['Address', 'Assets', 'Inheritor', 'Executor'],
			values: nodes.map((node) => {
				return {
					ID: node,
					owner: assets.filter((asset) => asset.owner === node).map((asset) => asset.ID),
					inheritors: assets
						.filter((asset) => asset.inheritors.includes(node))
						.map((asset) => asset.ID),
					executors: assets
						.filter((asset) => asset.executors.includes(node))
						.map((asset) => asset.ID)
				};
			})
			// [
			// (nodes,
			// nodes.map((node) => assets.find((asset) => asset.owner === node)?.ID),
			// nodes.map((node) => assets.find((asset) => asset.inheritors.includes(node))?.ID),
			// nodes.map((node) => assets.find((asset) => asset.executors.includes(node))?.ID))
			// ]
		}
	};
</script>

<BaseView>
	<!-- <div class="headline-container" slot="headline"> -->
	<select class="dropdown" slot="headline" bind:value={selected}>
		<option value="assets">Owned assets</option>
		<option value="nodes">All nodes</option>
		<!-- <div class="hamburger"><span></span></div> -->
	</select>
	<!-- </div> -->
	<div class="content-container" slot="content">
		<div class="row row-0">
			<!-- {#if selected === 'assets'} -->
			<!-- <div class="prop"><span>ID</span></div> -->
			<!-- <div class="prop"><span>Owner</span></div> -->
			<!-- <div class="prop"><span>Inheritors</span></div> -->
			<!-- <div class="prop"><span>Executors</span></div> -->
			<!-- {:else} -->
			<!-- <div class="prop"><span>Address</span></div> -->
			<!-- <div class="prop"><span>Assets</span></div> -->
			<!-- <div class="prop"><span>Inheritor</span></div> -->
			<!-- <div class="prop"><span>Executor</span></div> -->
			<!-- {/if} -->
			{#each table[selected].props as prop}
				<div class="prop"><span>{prop}</span></div>
			{/each}
		</div>
		<!-- {#if selected === 'assets'} -->
		{#each table[selected].values as item}
			<div class="row">
				<div class="prop">
					<span>{item.ID}</span>
					{#if selected === 'assets'}
						<button
							on:click={() => {
								if (selected === 'assets') {
									selectedAsset.set(Number(item.ID));
								}
							}}><i class="fa-solid fa-magnifying-glass" /></button
						>
					{/if}
				</div>
				<div class="prop" class:scrollable={item.owner.length > 1}>
					{#each item.owner as ID}
						<span>{ID}</span>
					{/each}
				</div>
				<div class="prop" class:scrollable={item.inheritors.length > 1}>
					{#each item.inheritors as inheritor}
						<span>{inheritor}</span><br />
					{/each}
				</div>
				<div class="prop" class:scrollable={item.executors.length > 1}>
					{#each item.executors as executor}
						<span>{executor}</span><br />
					{/each}
				</div>
			</div>
		{/each}
		<!-- {:else} -->
		<!-- {#each nodes as node} -->
		<!-- <div class="row"> -->
		<!-- <div class="prop"> -->
		<!-- <span>{node}</span> -->
		<!-- </div> -->
		<!-- <div class="prop"></div> -->
		<!-- </div> -->
		<!-- {/each} -->
		<!-- {/if} -->
	</div>
</BaseView>

<style lang="scss">
	.dropdown {
		appearance: none;
		background-color: transparent;
		width: 100%;
		height: 60px;
		text-align: center;
		border: none;
		border-top-left-radius: 30px;
		border-top-right-radius: 30px;
		outline: none;
		cursor: pointer;

		font-weight: bold;
		font-size: 1.17em;
		font-family: inherit;
	}

	.content-container {
		position: relative;
		width: 100%;
		display: grid;
		grid-template-rows: auto;
		.row {
			width: 30vw;
			display: grid;
			grid-column-start: 1;
			grid-template-columns: repeat(4, calc(30vw / 4));
			align-content: center;
			border-bottom: 2px solid $primary-color;
			height: 40px;
			.prop {
				height: inherit;
				border-left: 2px solid $primary-color;
				overflow: hidden;
				text-overflow: ellipsis;
				padding-top: 0.3em;
				&.scrollable {
					min-width: 0;
					max-height: 40px;
					overflow-x: hidden;
					overflow-y: scroll;
					white-space: nowrap;

					& span {
						border-bottom: 1px solid #cfcfcf;
					}

					&::-webkit-scrollbar {
						width: 5px;
					}
					&::-webkit-scrollbar-thumb {
						background-color: #cfcfcf;
						border-radius: 5px;
					}
					&:hover {
						&::-webkit-scrollbar-thumb {
							background-color: #adadad;
							border-radius: 5px;
						}
					}
				}
				&:first-child {
					font-weight: bold;
					border-left: none;

					padding-left: 0.5em;
				}
			}

			&:first-child {
				font-weight: bold;
			}
		}
	}
</style>
