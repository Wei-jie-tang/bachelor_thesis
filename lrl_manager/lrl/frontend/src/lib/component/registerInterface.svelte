<script lang="ts">
	import BaseView from './BaseView.svelte';
	let methods = ['registerNode', 'registerAsset'];
	let selected: string;
</script>

<BaseView>
	<select class="dropdown" slot="headline" bind:value={selected}>
		{#each methods as method}
			<option value={method}>{method}</option>
		{/each}
	</select>

	<form method="POST" action="/methods/{selected}" slot="content">
		<label class="param-class">
			{#if selected === 'registerNode'}
				Address:
			{:else if selected === 'registerAsset'}
				Owner:
			{/if}
			<input
				type="text"
				class="param-input"
				name="address"
				autocomplete="off"
				placeholder="0x1234567890abcdef"
			/>
		</label>

		{#if selected === 'registerAsset'}
			<label class="sub-param">
				Number of Executors:
				<input type="number" class="param-input" name="numExecutors" />
			</label>

			<label>
				Threshold:
				<input type="number" class="param-input" name="threshold" />
			</label>
		{/if}

		<span class="param-class">Machine requirements</span>
		<label class="sub-param">
			CPU cores:
			<input type="number" class="param-input" name="cores" />
		</label>

		<label class="sub-param">
			CPU speed (GHz):
			<input type="number" step="0.1" class="param-input" name="speed" />
		</label>

		<label class="sub-param">
			RAM (GB):
			<input type="number" step="0.5" class="param-input" name="ram" />
		</label>

		<span class="param-class">Network requirements</span>

		<label class="sub-param">
			Bandwidth (Mbit/s):
			<input type="number" step="100" class="param-input" name="bandwidth" />
		</label>

		<label class="sub-param">
			Average RTT (ms):
			<input type="number" class="param-input" name="rtt" />
		</label>

		<input type="submit" class="submit" />
	</form>
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

	form {
		display: flex;
		flex-direction: column;
		font-size: 1.2em;
		padding: 0 2em 0 2em;
		.param-class {
			margin-bottom: 1em;
			margin-top: 1em;
			display: block;
		}

		.sub-param {
			display: block;
			padding-left: 2em;
			.param-input {
				width: 40px;
			}
		}
		.submit {
			margin-top: 1em;
			width: 50%;
			align-self: center;
		}
	}
</style>
