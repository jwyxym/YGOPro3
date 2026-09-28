import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Rollup } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from '@vitejs/plugin-vue-jsx';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async ({ mode }) => ({
	plugins: [
		vue(), vueJsx(),
		...(mode === 'web' ? [
			viteStaticCopy({
				targets: [
					{
						src: '.ci/config/*.toml',
						dest: 'config',
						rename: { stripBase: true },
					},
					{
						src: '.ci/sound/*',
						dest: 'sound',
						rename: { stripBase: true },
					},
					{
						src: '.ci/textures/**/*',
						dest: 'textures',
						rename: { stripBase: 2 },
					},
				],
			}),
		] : [])
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@invoke': fileURLToPath(new URL(
				mode === 'web'
					? './src/script/invoke/web.ts'
					: './src/script/invoke/tauri.ts',
				import.meta.url
			)),
			'@voice': fileURLToPath(new URL(
				mode === 'web'
					? './src/script/voice/web.ts'
					: './src/script/voice/tauri.ts',
				import.meta.url
			)),
			'@ws': fileURLToPath(new URL(
				mode === 'web'
					? './src/pages/duel/ygo-protocol/ws/web.ts'
					: './src/pages/duel/ygo-protocol/ws/tauri.ts',
				import.meta.url
			))
		},
	},
	define: {
		__WEB__: JSON.stringify(mode === 'web'),
		__ANDROID__: JSON.stringify(process.env.TAURI_ENV_PLATFORM === 'android'),
		__DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
	},
	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
				protocol: "ws",
				host,
				port: 1421,
				}
			: undefined,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
	build: {
		target: "esnext",
		rollupOptions: {
			output: {
				assetFileNames(asset : Rollup.PreRenderedAsset) {
					return asset.names.some(name => name.endsWith('.mjs'))
						? 'assets/[name]-[hash].js'
						: 'assets/[name]-[hash][extname]';
				},
				manualChunks(id : string) {
					if (
						id.includes('node_modules')
						&& (id.endsWith('.js') || id.endsWith('.ts'))) {
						return 'vendor';
					}
				}
			}
		}
	},
	optimizeDeps: {
		exclude: ["ygopic-best"]
	}
}));
