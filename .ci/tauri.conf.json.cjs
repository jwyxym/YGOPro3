const fs = require('fs');
const path = require('path');

const os = process.argv[2] || '';
const pack = process.argv[3] || '';
const version = process.argv[4] || '0.1.0';

const tauriConfig = {
	$schema: "https://schema.tauri.app/config/2",
	productName: "ygopro3",
	version: version,
	identifier: "pro.jwyxym.ygo3",
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
					allow: ["$PUBLIC/**", "$RESOURCE/**"]
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

if (os === 'linux')
	if (pack === 'appimage') 
		tauriConfig.bundle.targets = ['appimage'];
	else if (pack === 'deb') 
		tauriConfig.bundle.targets = ['deb'];
	else if (pack === 'rpm') 
		tauriConfig.bundle.targets = ['rpm'];

if (os === 'windows' || os === 'macos' || (os === 'linux' && pack !== 'appimage'))
	tauriConfig.bundle.resources = [
		"assets.zip"
	];

const configPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
fs.writeFileSync(configPath, JSON.stringify(tauriConfig, null, 4), 'utf-8');