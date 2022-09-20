// @ts-ignore
import App from './App.svelte';
import { state } from 'shared';
console.log('remote got message:', state.message);


const app = new App({
	target: document.getElementById('app'),
});

export default app;
