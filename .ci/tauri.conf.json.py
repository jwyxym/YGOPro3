import json
import sys

os = sys.argv[1] if len(sys.argv) >= 2 else ''
args = (sys.argv[2] if len(sys.argv) >= 3 else '0.1.0').split('.')
version = f"{args[0][-2:]}.{int(args[1])}.{int(args[2])}"

tauri_config = {
	"productName" : "ygopro3",
	"version" : version,
	"identifier" : "cn.jwyxym.ygopro3",
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
					"allow" : ["$HOME/**", "$RESOURCE/**"]
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

if os == 'dev':
	tauri_config["bundle"]["resources"] = []
elif os == 'macos':
	tauri_config["bundle"]["resources"] = ["assets", "libygoserver.dylib"]
elif os == 'linux':
	tauri_config["bundle"]["resources"] = ["assets", "libygoserver.so"]
elif os == 'windows':
	tauri_config["bundle"]["resources"] = ["assets", "ygoserver.dll"]
else:
	tauri_config["bundle"]["resources"] = ["assets"]

path = './src-tauri/tauri.conf.json'
with open(path, 'w', encoding = 'utf-8') as f :
	json.dump(tauri_config, f, indent = 4)