import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { federation } from './module-federation/vite-federation-plugin';
import { createEsBuildAdapter } from '@softarc/native-federation-esbuild';
import { sveltePlugin } from './module-federation/esbuild-svelte-plugin';

// https://vitejs.dev/config/
export default defineConfig(async ({command, mode}) => ({
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
		svelte()
	],
}));
