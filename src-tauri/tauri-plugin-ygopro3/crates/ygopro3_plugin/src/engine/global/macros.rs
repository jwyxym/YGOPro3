use tokio::task::spawn_blocking;
use rquickjs::Error;

#[allow(unused_macros)]
macro_rules! set_sync {
	($ctx:expr, $obj:expr, $name:literal, $func:expr) => {{
		let f = Function::new($ctx.clone(), $func)?;
		$obj.set($name, f)?;
	}};
}

macro_rules! set_async {
	($ctx:expr, $obj:expr, $name:literal, $func:expr) => {{
		let f = Function::new($ctx.clone(), Async($func))?;
		$obj.set($name, f)?;
	}};
}

macro_rules! if_plugin_allowed {
	($map:expr, $permission:literal, $body:block) => {
		if $map.get($permission).copied().unwrap_or(false) {
			$body
		}
	};
}

pub fn js_error (message: impl ToString) -> Error {
	Error::new_from_js_message("Rust", "Error", message.to_string())
}

pub async fn blocking<F, T> (f: F) -> Result<T, Error>
where
	F: FnOnce() -> Result<T, String> + Send + 'static,
	T: Send + 'static,
{
	spawn_blocking(f)
		.await
		.map_err(js_error)?
		.map_err(js_error)
}

#[allow(unused)]
pub(super) use set_sync;
pub(super) use set_async;
pub(super) use if_plugin_allowed;