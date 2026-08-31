use std::{fs, io::Error, path::Path};

macro_rules! plugin_path {
	($path:expr, $name:expr) => {{
		let path: &Path = $path.as_ref();
		if $name.ends_with(".js") {
			path
				.join("plugin")
				.join($name)
		} else { 
			path
				.join("plugin")
				.join(format!("{}.js", $name))
		}
	}};
}

pub fn read<P: AsRef<Path>> (path: P, name: &str) -> Result<String, Error> {
	fs::read_to_string(plugin_path!(path, name))
}

pub fn write<P: AsRef<Path>> (path: P, name: &str, content: String) -> Result<(), Error> {
	fs::write(plugin_path!(path, name), content)
}
