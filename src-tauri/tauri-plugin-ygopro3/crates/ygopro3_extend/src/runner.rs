use ygopro3_log::log::write;

use anyhow::{anyhow, Error, Result};
use rquickjs::{
	Context,
	Function,
	Runtime,
	Object,
	prelude::Ctx,
	Error as JSError
};
use std::{
	collections::BTreeMap,
	sync::{
		mpsc::{self, Sender},
		OnceLock,
	},
	thread,
};

static EXTENDS: OnceLock<Sender<Command>> = OnceLock::new();

struct Extend {
	ctx: Context,
	_rt: Runtime,
}

pub enum Command {
	Load {
		name: String,
		script: String,
		reply: Sender<Result<(), String>>,
	},
	Call {
		name: String,
		args: String,
		reply: Sender<Result<String, String>>,
	},
	Unload {
		name: String,
		reply: Sender<Result<(), String>>,
	},
	UnloadAll {
		reply: Sender<Result<(), String>>,
	},
}

pub fn sender () -> &'static Sender<Command> {
	EXTENDS.get_or_init(|| {
		let (tx, rx) = mpsc::channel::<Command>();

		thread::spawn(move || {
			let mut extends: BTreeMap<String, Extend> = BTreeMap::new();

			while let Ok(command) = rx.recv() {
				match command {
					Command::Load {
						name,
						script,
						reply,
					} => {
						let result: Result<(), String> = load(&mut extends, name, &script)
							.map_err(|err| err.to_string());
						let _ = reply.send(result);
					}
					Command::Call {
						name,
						args,
						reply,
					} => {
						let result: Result<String, String> = call(&mut extends, &name, &args)
							.map_err(|err: Error| err.to_string());
						let _ = reply.send(result);
					}
					Command::Unload {
						name,
						reply,
					} => {
						let result: Result<(), String> = unload(&mut extends, &name)
							.map_err(|err| err.to_string());
						let _ = reply.send(result);
					}
					Command::UnloadAll {
						reply,
					} => {
						extends.clear();
						let _ = reply.send(Ok(()));
					}
				}
			}
		});

		tx
	})
}

pub fn receive<T> (rx: mpsc::Receiver<Result<T, String>>) -> Result<T, Error> {
	rx.recv()
		.map_err(|err| anyhow!("extend worker disconnected: {}", err))?
		.map_err(Error::msg)
}

fn load (extends: &mut BTreeMap<String, Extend>, name: String, script: &str) -> Result<(), Error> {
	let rt: Runtime = Runtime::new()?;
	let ctx: Context = Context::full(&rt)?;

	globals(&ctx)?;

	ctx.with(|ctx: Ctx<'_>| ctx.eval::<(), _>(script))?;

	extends.insert(name, Extend {
		ctx,
		_rt: rt,
	});

	Ok(())
}

fn call (extends: &mut BTreeMap<String, Extend>, name: &str, args: &str) -> Result<String, Error> {
	let extend = extends
		.get_mut(name)
		.ok_or_else(|| anyhow!("extend not loaded: {}", name))?;

	extend.ctx.with(|ctx| {
		let globals = ctx.globals();

		globals.set("__ygopro3_args", args)?;

		let result: String = ctx.eval(r#"
			JSON.stringify(
				main.apply(
					undefined,
					JSON.parse(__ygopro3_args)
				)
			)
		"#)?;

		Ok(result)
	})
}

fn unload (extends: &mut BTreeMap<String, Extend>, name: &str) -> Result<(), Error> {
	extends
		.remove(name)
		.ok_or_else(|| anyhow!("extend not loaded: {}", name))?;

	Ok(())
}

fn globals (ctx: &Context) -> Result<(), Error> {
	ctx.with(|ctx: Ctx<'_>| {
		let globals: Object<'_> = ctx.globals();
		let ygopro3: Object<'_> = Object::new(ctx.clone())?;

		let log: Function<'_> = Function::new(ctx.clone(), |msg: String| {
			write(format!("YGOPro3 Extend: {}", msg))
				.map_err(|err| JSError::new_from_js_message(
					"Rust",
					"Error",
					err.to_string(),
				))
		})?;

		ygopro3.set("log", log)?;
		globals.set("YGOPro3", ygopro3)?;
		Ok::<_, Error>(())
	})
}