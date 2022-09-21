<script lang="ts">
	let count = 0;

	const handleClick = () => {
		count += 1;
	};
</script>

<div class="card">
	<button on:click={handleClick}>
		clicks: {count}
	</button>
</div>

<style>
	.card {
		background: #1f2124;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
		border-radius: 5px;
		margin: 20px 20px 20px 20px;
		width: 250px;
		padding: 20px;
		text-align: center;
		color: white;
		float: left;
	}
</style>
