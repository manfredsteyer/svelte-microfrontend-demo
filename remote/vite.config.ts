import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { federation } from './module-federation/vite-federation-plugin';
// import { esBuildAdapter } from './module-federation/esbuild-adapter';
import { createEsBuildAdapter } from '@softarc/native-federation-esbuild';
import { sveltePlugin } from './module-federation/esbuild-svelte-plugin';


export default defineConfig(async ({command}) => ({
	server: {
		fs: {
			allow: [
				'.',
				'../shared'
			]
		}
	},
	plugins: [
		// tsconfigPaths(),
		federation({
			options: {
				workspaceRoot: __dirname,
				outputPath: 'dist',
				tsConfig: 'tsconfig.json',
				federationConfig: 'module-federation/federation.config.cjs',
				verbose: false,
				dev: command === 'serve'
			},
			adapter: createEsBuildAdapter({ 
				plugins: [sveltePlugin]
			}),
		}),
		svelte(), 
	],
}));