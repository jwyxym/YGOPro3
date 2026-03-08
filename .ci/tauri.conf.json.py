import json
import sys

os = sys.argv[1] if len(sys.argv) >= 2 else ''
pack = sys.argv[2] if len(sys.argv) >= 3 else ''
version = sys.argv[3] if len(sys.argv) >= 4 else '0.1.0'

tauri_config = {
	"$schema" : "https://schema.tauri.app/config/2",
	"productName" : "ygopro3",
	"version" : version,
	"identifier" : "pro.jwyxym.ygo3",
	"build" : {
		"beforeDevCommand" : "npm run dev",
		"devUrl" : "http://localhost:1420",
		"beforeBuildCommand" : "npm run build",
		"frontendDist" : "../dist"
	},
	"app" : {
		"windows" : [
			{
				"title" : "ygopro3",
				"width" : 1280,
				"height" : 720
			}
		],
		"security" : {
			"csp" : {
				"img-src" : "'self' asset: http: https: blob: data:",
				"script-src" : "'self' 'wasm-unsafe-eval'"
			},
			"assetProtocol" : {
				"enable" : True,
				"scope" : {
					"allow" : ["$PUBLIC/**", "$RESOURCE/**"]
				}
			}
		}
	},
	"bundle" : {
		"active" : True,
		"targets" : "all",
		"icon" : [
			"icons/32x32.png",
			"icons/128x128.png",
			"icons/128x128@2x.png",
			"icons/icon.icns",
			"icons/icon.ico"
		]
	}
}

if os == 'linux':
	if pack == 'appimage':
		tauri_config["bundle"]["targets"] = ['appimage']
	elif pack == 'deb':
		tauri_config["bundle"]["targets"] = ['deb']
	elif pack == 'rpm':
		tauri_config["bundle"]["targets"] = ['rpm']

if os == 'windows' or os == 'macos' or (os == 'linux' and pack != 'appimage'):
	tauri_config["bundle"]["resources"] = [
		"assets.zip"
	]

path = './src-tauri/tauri.conf.json'
with open(path, 'w', encoding = 'utf-8') as f :
	json.dump(tauri_config, f, indent = 4)