const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

// URLs, hashes and cache layout match tauri-cli-v2.12.4:
// https://github.com/tauri-apps/tauri/tree/tauri-cli-v2.12.4/crates/tauri-bundler/src/bundle
const cliVersion = '2.12.4';
const root = path.resolve(__dirname, '..');
const installedVersion = require(path.join(root, 'package-lock.json')).packages['node_modules/@tauri-apps/cli'].version;
if (installedVersion !== cliVersion) {
	throw new Error(`Update the build-tool URLs and cache layout for Tauri CLI ${installedVersion} (expected ${cliVersion}).`);
}

const run = (command, args, options = {}) => {
	const result = spawnSync(command, args, { stdio: 'inherit', ...options });
	if (result.error) {
		throw result.error;
	}
	if (result.status !== 0) {
		throw new Error(`${command} exited with status ${result.status}`);
	}
};

const validFile = (file, algorithm, expected) => {
	if (!fs.existsSync(file) || !fs.statSync(file).isFile() || fs.statSync(file).size === 0) {
		return false;
	}
	if (!expected) {
		return true;
	}
	return crypto.createHash(algorithm).update(fs.readFileSync(file)).digest('hex') === expected.toLowerCase();
};

const download = (url, file, algorithm, expected) => {
	if (validFile(file, algorithm, expected)) {
		console.log(`Using cached file: ${file}`);
		return;
	}
	fs.mkdirSync(path.dirname(file), { recursive: true });
	if (process.argv[2] !== 'fetch') {
		const artifactDirectory = process.env.BUILD_TOOLS_ARTIFACT;
		if (!artifactDirectory) {
			throw new Error('BUILD_TOOLS_ARTIFACT must point to the artifact downloaded from prepare-build-tools.');
		}
		const source = path.join(artifactDirectory, path.basename(new URL(url).pathname));
		if (!validFile(source, algorithm, expected)) {
			throw new Error(`Build-tool artifact is missing or has an invalid checksum: ${source}`);
		}
		fs.copyFileSync(source, file);
		console.log(`Installed from artifact: ${source}\n  -> ${file}`);
		return;
	}
	const partial = `${file}.part`;
	console.log(`Downloading ${url}\n  -> ${file}`);
	run(process.platform === 'win32' ? 'curl.exe' : 'curl', [
		'--fail', '--location', '--show-error', '--silent',
		'--retry', '5', '--retry-all-errors', '--retry-delay', '5',
		'--connect-timeout', '30', '--max-time', '600',
		'--user-agent', `YGOPro3-build-tools/tauri-cli-${cliVersion}`,
		'--output', partial, url
	]);
	if (!validFile(partial, algorithm, expected)) {
		throw new Error(`Empty download or checksum mismatch: ${url}`);
	}
	fs.renameSync(partial, file);
};

const requireFiles = (directory, names) => {
	for (const name of names) {
		if (!validFile(path.join(directory, name))) {
			throw new Error(`Missing build tool: ${path.join(directory, name)}`);
		}
	}
};

const toolsPath = process.platform === 'win32'
	? path.join(process.env.LOCALAPPDATA, 'tauri')
	: path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'tauri');

const linuxTools = (arch) => [
	[`AppRun-${arch}`, `https://github.com/tauri-apps/binary-releases/releases/download/apprun-old/AppRun-${arch}`],
	[`linuxdeploy-07333c6-${arch}.AppImage`, `https://github.com/tauri-apps/binary-releases/releases/download/linuxdeploy-07333c6/linuxdeploy-${arch}.AppImage`],
	['linuxdeploy-plugin-appimage.AppImage', `https://github.com/linuxdeploy/linuxdeploy-plugin-appimage/releases/download/continuous/linuxdeploy-plugin-appimage-${arch}.AppImage`]
];

const fetchTools = (outputDirectory) => {
	if (!outputDirectory) {
		throw new Error('Usage: node .ci/prepare-build-tools.cjs fetch <output-directory>');
	}
	const fetchFile = (group, url, algorithm, expected) => {
		const file = path.join(outputDirectory, group, path.basename(new URL(url).pathname));
		download(url, file, algorithm, expected);
		return file;
	};
	fetchFile('windows', 'https://github.com/wixtoolset/wix3/releases/download/wix3141rtm/wix314-binaries.zip',
		'sha256', '6ac824e1642d6f7277d0ed7ea09411a508f6116ba6fae0aa5f2c7daa2ff43d31');
	fetchFile('windows', 'https://github.com/tauri-apps/binary-releases/releases/download/nsis-3.13/nsis-3.13.zip',
		'sha1', 'DB14F8AF2EA346B786C6AE19343F61AAF5E09B8E');
	fetchFile('windows', 'https://github.com/tauri-apps/nsis-tauri-utils/releases/download/nsis_tauri_utils-v0.5.3/nsis_tauri_utils.dll',
		'sha1', '75197FEE3C6A814FE035788D1C34EAD39349B860');
	for (const arch of ['x86_64', 'aarch64']) {
		for (const [, url] of linuxTools(arch)) {
			fetchFile(`linux-${arch}`, url);
		}
	}
	// Gradle version from the Android template bundled with tauri-cli-v2.12.4.
	const gradleUrl = 'https://services.gradle.org/distributions/gradle-9.6.1-bin.zip';
	const checksumFile = fetchFile('android', `${gradleUrl}.sha256`);
	const checksum = fs.readFileSync(checksumFile, 'utf8').trim();
	if (!/^[a-f\d]{64}$/i.test(checksum)) {
		throw new Error('Invalid Gradle distribution SHA-256.');
	}
	fetchFile('android', gradleUrl, 'sha256', checksum);
	console.log(`All build-tool artifacts ready: ${outputDirectory}`);
};

const prepareWindows = () => {
	const archives = path.join(toolsPath, 'downloads');
	const wixArchive = path.join(archives, 'wix314-binaries.zip');
	const wixPath = path.join(toolsPath, 'WixTools314');
	download('https://github.com/wixtoolset/wix3/releases/download/wix3141rtm/wix314-binaries.zip',
		wixArchive, 'sha256', '6ac824e1642d6f7277d0ed7ea09411a508f6116ba6fae0aa5f2c7daa2ff43d31');
	fs.mkdirSync(wixPath, { recursive: true });
	run('tar', ['-xf', wixArchive, '-C', wixPath]);
	requireFiles(wixPath, [
		'candle.exe', 'candle.exe.config', 'darice.cub', 'light.exe', 'light.exe.config',
		'wconsole.dll', 'winterop.dll', 'wix.dll', 'WixUIExtension.dll', 'WixUtilExtension.dll'
	]);

	const nsisArchive = path.join(archives, 'nsis-3.13.zip');
	const nsisPath = path.join(toolsPath, 'NSIS');
	download('https://github.com/tauri-apps/binary-releases/releases/download/nsis-3.13/nsis-3.13.zip',
		nsisArchive, 'sha1', 'DB14F8AF2EA346B786C6AE19343F61AAF5E09B8E');
	const staging = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'tauri-nsis-'));
	run('tar', ['-xf', nsisArchive, '-C', staging]);
	fs.cpSync(path.join(staging, 'nsis-3.13'), nsisPath, { recursive: true });
	download('https://github.com/tauri-apps/nsis-tauri-utils/releases/download/nsis_tauri_utils-v0.5.3/nsis_tauri_utils.dll',
		path.join(nsisPath, 'Plugins/x86-unicode/additional/nsis_tauri_utils.dll'),
		'sha1', '75197FEE3C6A814FE035788D1C34EAD39349B860');
	requireFiles(nsisPath, [
		'makensis.exe', 'Bin/makensis.exe', 'Stubs/lzma-x86-unicode', 'Stubs/lzma_solid-x86-unicode',
		'Include/MUI2.nsh', 'Include/FileFunc.nsh', 'Include/x64.nsh', 'Include/nsDialogs.nsh',
		'Include/WinMessages.nsh', 'Include/Win/COM.nsh', 'Include/Win/Propkey.nsh',
		'Include/Win/RestartManager.nsh', 'Plugins/x86-unicode/NSISdl.dll',
		'Plugins/x86-unicode/StartMenu.dll', 'Plugins/x86-unicode/System.dll', 'Plugins/x86-unicode/nsDialogs.dll'
	]);
	if (!validFile(path.join(nsisPath, 'NSIS.exe'), 'sha1', '6D45D4E8CCF18FE1FDAC9164058F356102A2ECF2')) {
		throw new Error('NSIS.exe checksum does not match the version required by Tauri CLI.');
	}
	console.log(`Windows packaging tools ready: ${toolsPath}`);
};

const prepareLinux = (arch, bundle) => {
	if (bundle !== 'appimage') {
		console.log(`${bundle} uses the system dependencies installed by this workflow; no extra bundler downloads.`);
		return;
	}
	if (!['x86_64', 'aarch64'].includes(arch)) {
		throw new Error(`Unsupported AppImage architecture: ${arch}`);
	}
	const files = linuxTools(arch);
	for (const [name, url] of files) {
		const file = path.join(toolsPath, name);
		download(url, file);
		const descriptor = fs.openSync(file, 'r');
		const magic = Buffer.alloc(4);
		try {
			fs.readSync(descriptor, magic, 0, 4, 0);
		} finally {
			fs.closeSync(descriptor);
		}
		if (!magic.equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))) {
			throw new Error(`Expected an ELF executable: ${file}`);
		}
		fs.chmodSync(file, 0o770);
	}
	// Check that linuxdeploy can execute on this runner before spending time compiling Rust.
	run(path.join(toolsPath, `linuxdeploy-07333c6-${arch}.AppImage`), ['--appimage-extract-and-run', '--version'], {
		env: { ...process.env, APPIMAGE_EXTRACT_AND_RUN: '1' }
	});
	console.log(`AppImage tools ready: ${toolsPath}; GTK/GStreamer scripts are embedded in the CLI.`);
};

const prepareAndroid = () => {
	const project = path.join(root, 'src-tauri/gen/android');
	const propertiesFile = path.join(project, 'gradle/wrapper/gradle-wrapper.properties');
	let text = fs.readFileSync(propertiesFile, 'utf8');
	const properties = Object.fromEntries(text.split(/\r?\n/)
		.filter((line) => /^\w+=/.test(line))
		.map((line) => {
			const index = line.indexOf('=');
			return [line.slice(0, index), line.slice(index + 1).trim().replace(/\\([:=\\])/g, '$1')];
		}));
	const url = new URL(properties.distributionUrl);
	if (url.protocol !== 'https:' || url.hostname !== 'services.gradle.org' || url.username || url.password) {
		throw new Error(`Unexpected Gradle distribution URL: ${url}`);
	}
	const gradleHome = process.env.GRADLE_USER_HOME || path.join(os.homedir(), '.gradle');
	const baseDirectory = (base) => {
		if (!base || base === 'GRADLE_USER_HOME') {
			return gradleHome;
		}
		if (base === 'PROJECT') {
			return project;
		}
		throw new Error(`Unsupported Gradle cache base: ${base}`);
	};
	// Match Gradle Wrapper's PathAssembler: MD5 of the original URL as an unsigned base-36 number.
	const urlHash = BigInt(`0x${crypto.createHash('md5').update(url.href).digest('hex')}`).toString(36);
	const name = path.basename(url.pathname);
	if (!/^gradle-[\d.]+-bin\.zip$/.test(name)) {
		throw new Error(`Unexpected Gradle archive name: ${name}`);
	}
	const relativePath = path.join(name.slice(0, -4), urlHash);
	const archive = path.join(baseDirectory(properties.zipStoreBase), properties.zipStorePath || 'wrapper/dists', relativePath, name);
	const distribution = path.join(baseDirectory(properties.distributionBase), properties.distributionPath || 'wrapper/dists', relativePath);
	const installed = fs.existsSync(`${archive}.ok`) && fs.existsSync(distribution)
		&& fs.readdirSync(distribution).some((entry) => fs.existsSync(path.join(distribution, entry, 'bin/gradle')));
	if (!installed) {
		let checksum = properties.distributionSha256Sum;
		if (!checksum) {
			const checksumFile = `${archive}.sha256`;
			download(`${url.href}.sha256`, checksumFile);
			checksum = fs.readFileSync(checksumFile, 'utf8').trim();
		}
		if (!/^[a-f\d]{64}$/i.test(checksum)) {
			throw new Error('Invalid Gradle distribution SHA-256.');
		}
		download(url.href, archive, 'sha256', checksum);
		properties.distributionSha256Sum = checksum;
	}
	for (const [key, value] of Object.entries({
		networkTimeout: '120000', retries: '3', retryBackOffMs: '1000',
		...(properties.distributionSha256Sum ? { distributionSha256Sum: properties.distributionSha256Sum } : {})
	})) {
		const pattern = new RegExp(`^${key}=.*$`, 'm');
		text = pattern.test(text) ? text.replace(pattern, `${key}=${value}`) : `${text.trimEnd()}\n${key}=${value}\n`;
	}
	fs.writeFileSync(propertiesFile, text);
	// Let the Wrapper unpack, validate and mark the prefetched ZIP; this does not compile the app.
	run('bash', ['./gradlew', '--version'], { cwd: project });
	console.log(`Gradle ready: ${distribution}`);
};

const [platform, arch, bundle] = process.argv.slice(2);
switch (platform) {
	case 'fetch':
		fetchTools(arch);
		break;
	case 'android':
		prepareAndroid();
		break;
	case 'windows':
		prepareWindows();
		break;
	case 'linux':
		prepareLinux(arch, bundle);
		break;
	case 'macos':
		for (const command of ['xcrun', 'hdiutil', 'osascript']) {
			run('/usr/bin/which', [command]);
		}
		console.log('macOS packaging uses Xcode/system tools and DMG scripts embedded in Tauri CLI; no extra downloads.');
		break;
	default:
		throw new Error(`Unknown platform: ${platform}`);
}
