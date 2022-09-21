import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { federation } from './module-federation/vite-federation-plugin';
import { esBuildAdapter } from './module-federation/esbuild-adapter';
import tsconfigPaths from 'vite-tsconfig-paths'
import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs'

export default defineConfig(async ({command}) => ({
	server: {
		fs: {
			// IMPORTANT: Make sure to allow access to all shared libs
			//	esp. if they are not directly below the project's 
			//	directory like here. Also, don't forget '.'
			// strict: false
			allow:[
				'.',
				'../shared', 
			]
		}
	},
	plugins: [
		esbuildCommonjs(['colormap']),
		// IMPORTANT: Don't use this plugin!
		// tsconfigPaths(),
		federation({
			options: {
				workspaceRoot: __dirname,
				outputPath: 'dist',
				tsConfig: 'tsconfig.json',
				federationConfig: 'module-federation/federation.config.cjs',
				verbose: false,
				debug: command === 'serve'
			},
			adapter: esBuildAdapter,
		}),
		svelte(), 
	],
}));