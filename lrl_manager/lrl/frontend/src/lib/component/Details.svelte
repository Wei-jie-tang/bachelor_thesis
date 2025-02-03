<script lang="ts">
	import img_setPW from '$lib/assets/password.png';
	import { assets } from '$lib/stores/assets';
	import BaseView from './BaseView.svelte';
	import { selectedAsset } from '$lib/stores/details';
	import '@fortawesome/fontawesome-free/css/all.min.css';

	export let details: { owner: string; inheritors: string[]; executors: string[] };
	let method = '';
	function addInhertor() {
		method = 'inheritor';
	}

	function addExecutor() {
		method = 'executor';
	}

	function setPassword() {}
</script>

<BaseView>
	<div class="headline-container" slot="headline">
		<h3>Assets {$selectedAsset}</h3>
		<!--<button class="button" on:click={setPassword}>-->
		<!--<i class="fa-solid fa-lock"></i>-->
		<!--</button>-->
	</div>
	<div class="content-container" slot="content">
		{#if details != undefined}
			<div class="section" id="owner">
				<h3>Owner</h3>
				<span>{details.owner}</span>
			</div>
			<div class="section" id="inheritors">
				<h3>Inheritors</h3>
				<button class="button" on:click={addInhertor}>
					<i class="fa-solid fa-user-plus"></i>
					<span class="tooltip">Add Inheritor</span>
				</button>
				<!-- <button class="button"> -->
				<!-- <i class="fa-solid fa-user-minus"></i> -->
				<!-- <span class="tooltip">Remove Inheritor</span> -->
				<!-- </button> -->
				{#each details.inheritors as inheritor}
					<form method="POST" action="/methods/transferAsset">
						<input type="number" name="assetID" readonly value={$selectedAsset} class="hidden" />
						<input type="string" name="inheritor" readonly value={inheritor} class="address" />
						<button type="submit" class="button">
							<i class="fa-regular fa-circle-right"></i>
							<span class="tooltip">transfer Asset to {inheritor}</span>
						</button>
					</form>
				{/each}
			</div>
			<div class="section" id="executors">
				<h3>Executors</h3>
				<button class="button" on:click={addExecutor}>
					<i class="fa-solid fa-user-plus"></i>
					<span class="tooltip">Add Executor</span>
				</button>
				<!-- <button class="button"> -->
				<!-- <i class="fa-solid fa-user-minus"></i> -->
				<!-- <span class="tooltip">Remove Executor</span> -->
				<!-- </button> -->
				{#each details.executors as executor}
					<span>{executor}</span><br />
				{/each}
			</div>
		{:else}
			<h3>No data available</h3>
		{/if}
	</div>
</BaseView>

{#if method !== ''}
	<div class="alert">
		<h4>Add {method}</h4>
		<form
			method="POST"
			action={method === 'inheritor' ? '/methods/addInheritor' : '/methods/addExecutor'}
		>
			<label>
				Asset:
				<input
					type="number"
					class="input address"
					name="assetID"
					bind:value={$selectedAsset}
					readonly
				/>
			</label>
			<label>
				Address:
				<input type="text" class="input address" name="address" placeholder="0x1234567890abcdef" />
			</label>
			<button type="submit">Add {method}</button>
		</form>
		<button
			on:click={() => {
				method = '';
			}}
		>
			Close
		</button>
	</div>
{/if}

<style lang="scss">
	$btn_setPW-width: 25px;

	.headline-container {
		display: flex;
		align-items: center;
		justify-content: center;
		border-bottom: 2px solid $primary-color;
		height: 60px;
		> * {
			padding-left: 20px;
			padding-right: 20px;
		}
		button {
			position: relative;
			border: none;
			padding: 0;
			background-color: transparent;
			cursor: pointer;
		}
	}

	.content-container {
		.section {
			border-bottom: 2px solid $primary-color;
			h3 {
				display: inline-block;
			}
			.address {
				font-family: inherit;
				font-size: inherit;
				border: none;
				width: 85%;
			}
			.hidden {
				position: absolute;
				visibility: hidden;
			}
			.button {
				position: relative;
				border: none;
				background-color: transparent;
				cursor: pointer;
				padding: 0;
				margin-left: 10px;
				.tooltip {
					position: absolute;
					z-index: 1;
					width: max-content;
					top: -0.5em;
					left: 2em;
					visibility: hidden;
					opacity: 0;
					transition: opacity 0.3s;
					border: 1px solid $primary-color;
					background-color: rgb(255, 245, 211);
					padding: 2px 5px 2px 5px;
				}
				&:hover .tooltip {
					visibility: visible;
					opacity: 1;
				}
			}
		}
	}
	.alert {
		position: absolute;
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		top: 50%;
		left: 50%;
		transform: translateX(-50%) translateY(-75%);
		z-index: 1;
		width: 50%;
		height: 50%;
		border: 2px solid $primary-color;
		border-radius: 10px;
		background-color: grey;

		text-align: center;
	}
</style>
