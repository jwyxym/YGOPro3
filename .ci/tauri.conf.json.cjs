const fs = require('fs');
const path = require('path');

const os = process.argv[2] || '';
const arg = (process.argv[3] || '0.1.0').split('.');
const version = `${arg[0].slice(-2)}.${Number(arg[1])}.${Number(arg[2])}`;

const tauriConfig = {
	productName: "ygopro3",
	version: version,
	identifier: "cn.jwyxym.ygopro3",
	build: {
		beforeDevCommand: "npm run dev",
		devUrl: "http://localhost:1420",
		beforeBuildCommand: "npm run build",
		frontendDist: "../dist"
	},
	app: {
		windows: [
			{
				title: "ygopro3",
				width: 1280,
				height: 720
			}
		],
		security: {
			csp: {
				"img-src": "'self' asset: http: https: blob: data:",
				"script-src": "'self' 'wasm-unsafe-eval'"
			},
			assetProtocol: {
				enable: true,
				scope: {
					allow: ["$HOME/**", "$RESOURCE/**"]
				}
			}
		}
	},
	bundle: {
		active: true,
		targets: "all",
		icon: [
			"icons/32x32.png",
			"icons/128x128.png",
			"icons/128x128@2x.png",
			"icons/icon.icns",
			"icons/icon.ico"
		]
	}
};

if (os !== 'dev')
	tauriConfig.bundle.resources = [
		"assets"
	];

const configPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
fs.writeFileSync(configPath, JSON.stringify(tauriConfig, null, 4), 'utf-8');