const fs = require('fs');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const os = process.argv[2] || '';
const URL = 'https://github.com/jwyxym/YGOPro3/releases/download/assets-latest/assets.zip';
const LOCAL_ASSETS = [
	'./src-tauri/assets.zip',
	'./src-tauri/assets',
	'./src-tauri/gen/android/app/src/main/assets/assets',
	'./src-tauri/target/debug/assets'
];

async function download(url, dest) {
	try {
		const res = await fetch(url);
		if (!res.ok) {
			throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
		}
		if (!res.body) {
			throw new Error(`Failed to download ${url}: response body is empty`);
		}

		const total = Number(res.headers.get('content-length')) || 0;
		const fileStream = fs.createWriteStream(dest);

		let downloaded = 0;
		const readable = typeof res.body.getReader === 'function'
			? Readable.fromWeb(res.body)
			: res.body;

		readable.on('data', (chunk) => {
			downloaded += chunk.length;
			if (total) {
				const percent = ((downloaded / total) * 100).toFixed(1);
				process.stdout.write(`\rDownload progress: ${percent}%`);
			}
		});

		await pipeline(readable, fileStream);

		console.log('\nDownload complete');
	} catch (error) {
		if (fs.existsSync(dest)) {
			fs.rmSync(dest, { force: true });
		}
		console.warn(`Download failed: ${error.message}`);
		throw error;
	}
}

function copyLocalAsset(dest) {
	for (const asset of LOCAL_ASSETS) {
		if (fs.existsSync(asset)) {
			fs.copyFileSync(asset, dest);
			return true;
		}
	}

	return false;
}

async function main () {
	if (os === 'Android') {
		const dest = './src-tauri/gen/android/app/src/main/assets/assets';
		fs.mkdirSync('./src-tauri/gen/android/app/src/main/assets', { recursive: true });
		if (!fs.existsSync(dest) && !copyLocalAsset(dest)) {
			await download(URL, dest);
		}
	} else {
		const dest = './src-tauri/target/debug/assets';
		fs.mkdirSync('./src-tauri/target/debug', { recursive: true });
		if (!fs.existsSync(dest) && !copyLocalAsset(dest)) {
			await download(URL, dest);
		}
	}
}

main();
