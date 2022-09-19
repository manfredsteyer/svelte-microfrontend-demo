import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { federation } from './module-federation/vite-federation-plugin';
import { esBuildAdapter } from './module-federation/esbuild-adapter';
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig(async () => ({
	plugins: [
		tsconfigPaths(),
		federation({
			options: {
				workspaceRoot: __dirname,
				outputPath: 'dist',
				tsConfig: 'tsconfig.json',
				federationConfig: 'module-federation/federation.config.cjs',
				verbose: false,
			},
			adapter: esBuildAdapter,
		}),
		svelte()
	],
}));
