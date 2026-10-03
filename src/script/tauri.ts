import { type OpenDialogOptions } from '@tauri-apps/plugin-dialog';

function file(options : OpenDialogOptions & { multiple : true }) : Promise<File[] | string[] | null | undefined>;
function file(options : OpenDialogOptions & { directory : true; multiple? : false }) : Promise<File[] | string | null | undefined>;
function file(options? : OpenDialogOptions & { directory? : false; multiple? : false }) : Promise<File | string | null | undefined>;
function file(options? : OpenDialogOptions) : Promise<File | File[] | string | string[] | null | undefined>;
async function file(options : OpenDialogOptions = {}) : Promise<File | File[] | string | string[] | null | undefined> {
	if (__WEB__) {
		return new Promise<File | File[] | undefined>((resolve, reject) => {
			const input = document.createElement('input');
			input.type = 'file';
			input.multiple = options.multiple ?? false;
			input.hidden = true;

			if (options.directory) {
				if (!('webkitdirectory' in input)) {
					reject(new Error('unspport webkitdirectory'));
					return;
				}
				input.webkitdirectory = true;
			} else {
				const extensions = options.filters?.flatMap(filter => filter.extensions)
					.map(extension => extension.trim().replace(/^\./, '').toLowerCase())
					.filter(Boolean) ?? [];
				input.accept = extensions.includes('*') ? '' : [...new Set(extensions)]
					.map(extension => `.${extension}`).join(',');
			}

			const cleanup = () => {
				input.onchange = null;
				input.oncancel = null;
				input.remove();
			};
			input.onchange = () => {
				const files = Array.from(input.files ?? []);
				cleanup();
				resolve(files.length ? (options.multiple || options.directory ? files : files[0]) : undefined);
			};
			input.oncancel = () => {
				cleanup();
				resolve(undefined);
			};
			try {
				input.click();
			} catch (error) {
				cleanup();
				reject(error);
			}
		});
	} else {
		const dialog = await import('@tauri-apps/plugin-dialog');
		return dialog.open(options);
	}
};

async function copy (text : string) {
	if (__WEB__) {
		return navigator.clipboard.writeText(text);
	} else {
		const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
		return writeText(text);
	}
};

async function open (url : string) {
	if (__WEB__)
		window.open(url);
	else {
		const { openUrl } = await import('@tauri-apps/plugin-opener');
		openUrl(url).catch();
	}
}
const f = __WEB__ ? fetch : (await import('@tauri-apps/plugin-http')).fetch;

export {
	file, copy, open, f as fetch
};
