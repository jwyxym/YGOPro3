import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from '@vitejs/plugin-vue-jsx';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async ({ mode }) => ({
	plugins: [vue(), vueJsx()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
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
