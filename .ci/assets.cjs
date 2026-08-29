const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const os = process.argv[2] || '';
const URL = 'https://www.ygopro3.cn/assets.zip';
const LOCAL_ASSETS = [
	'./src-tauri/assets.zip',
	'./src-tauri/assets'
];
const WINDBOT_ANDROID = [
	{
		abi: 'x86_64',
		url: 'https://github.com/jwyxym/windbot/releases/download/release-latest/windbot-android-x86_64.zip'
	},
	{
		abi: 'arm64-v8a',
		url: 'https://github.com/jwyxym/windbot/releases/download/release-latest/windbot-android-arm64-v8a.zip'
	},
	{
		abi: 'armeabi-v7a',
		url: 'https://github.com/jwyxym/windbot/releases/download/release-latest/windbot-android-armeabi-v7a.zip'
	}
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

function findEndOfCentralDirectory(buffer) {
	for (let i = buffer.length - 22; i >= 0; i--) {
		if (buffer.readUInt32LE(i) === 0x06054b50) {
			return i;
		}
	}

	throw new Error('Invalid zip: end of central directory not found');
}

function safeOutputPath(outputDir, fileName) {
	const outputPath = path.resolve(outputDir, fileName);
	const root = path.resolve(outputDir);
	if (outputPath !== root && !outputPath.startsWith(root + path.sep)) {
		throw new Error(`Invalid zip entry path: ${fileName}`);
	}

	return outputPath;
}

function unzip(zipFile, outputDir) {
	const buffer = fs.readFileSync(zipFile);
	const eocd = findEndOfCentralDirectory(buffer);
	const totalEntries = buffer.readUInt16LE(eocd + 10);
	const centralDirectoryOffset = buffer.readUInt32LE(eocd + 16);

	let offset = centralDirectoryOffset;
	for (let i = 0; i < totalEntries; i++) {
		if (buffer.readUInt32LE(offset) !== 0x02014b50) {
			throw new Error('Invalid zip: central directory header not found');
		}

		const compressionMethod = buffer.readUInt16LE(offset + 10);
		const compressedSize = buffer.readUInt32LE(offset + 20);
		const fileNameLength = buffer.readUInt16LE(offset + 28);
		const extraLength = buffer.readUInt16LE(offset + 30);
		const commentLength = buffer.readUInt16LE(offset + 32);
		const localHeaderOffset = buffer.readUInt32LE(offset + 42);
		const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString('utf8');

		offset += 46 + fileNameLength + extraLength + commentLength;
		if (fileName.endsWith('/')) {
			fs.mkdirSync(safeOutputPath(outputDir, fileName), { recursive: true });
			continue;
		}

		if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
			throw new Error(`Invalid zip: local file header not found for ${fileName}`);
		}

		const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
		const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
		const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
		const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
		let content;

		if (compressionMethod === 0) {
			content = compressed;
		} else if (compressionMethod === 8) {
			content = zlib.inflateRawSync(compressed);
		} else {
			throw new Error(`Unsupported zip compression method ${compressionMethod} for ${fileName}`);
		}

		const outputPath = safeOutputPath(outputDir, fileName);
		fs.mkdirSync(path.dirname(outputPath), { recursive: true });
		fs.writeFileSync(outputPath, content);
		console.log(`Extracted ${path.relative(outputDir, outputPath)}`);
	}
}

async function downloadWindbotAndroid() {
	const root = './kotlin/jniLibs';
	fs.mkdirSync(root, { recursive: true });
	fs.mkdirSync(path.join(root, 'x86'), { recursive: true });

	for (const target of WINDBOT_ANDROID) {
		const targetDir = path.join(root, target.abi);
		const zipFile = path.join(targetDir, 'windbot.zip');
		const windbotSo = path.join(targetDir, 'WindBot.so');
		fs.mkdirSync(targetDir, { recursive: true });

		if (fs.existsSync(windbotSo)) {
			console.log(`WindBot already exists for ${target.abi}`);
			continue;
		}

		if (!await download(target.url, zipFile)) {
			throw new Error(`Failed to download WindBot for ${target.abi}`);
		}

		unzip(zipFile, targetDir);
		fs.rmSync(zipFile, { force: true });
	}
}

async function main () {
	if (os === 'Android') {
		const dest = './src-tauri/gen/android/app/src/main/assets/assets';
		fs.mkdirSync('./src-tauri/gen/android/app/src/main/assets', { recursive: true });
		if (!fs.existsSync(dest) && !copyLocalAsset(dest)) {
			await download(URL, dest);
		}
		await downloadWindbotAndroid();
	} else {
		const dest = './src-tauri/target/debug/assets';
		fs.mkdirSync('./src-tauri/target/debug', { recursive: true });
		if (!fs.existsSync(dest) && !copyLocalAsset(dest)) {
			await download(URL, dest);
		}
	}
}

main();
