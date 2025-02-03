<div class="container">
	<div class="headline-container">
		<slot name="headline" />
	</div>
	<div class="content-container">
		<slot name="content" />
	</div>
</div>

<style lang="scss">
	.container {
		position: relative;
		border: 2px solid $primary-color;
		border-radius: 30px;
		height: 500px;
		width: 30vw;
	}

	.headline-container {
		border-bottom: 2px solid $primary-color;
		height: 60px;
	}
</style>
