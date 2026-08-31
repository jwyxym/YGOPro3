
use ygopro3_log::log::write;

use rquickjs::{
	Context,
	Function,
	Object,
	prelude::Ctx,
	Error
};

macro_rules! set {
	($ctx:expr, $obj:expr, $name:literal, $func:expr) => {{
		let f = Function::new($ctx.clone(), $func)?;
		$obj.set($name, f)?;
	}};
}

pub fn init (ctx: &Context) -> Result<(), Error> {
	ctx.with(|ctx: Ctx<'_>| {
		let globals: Object<'_> = ctx.globals();
		let ygopro3: Object<'_> = Object::new(ctx.clone())?;

		set!(ctx, ygopro3, "log", |msg: String| {
			write(format!("YGOPro3 Extend: {}", msg))
				.map_err(|err| Error::new_from_js_message(
					"Rust",
					"Error",
					err.to_string(),
				))
		});

		globals.set("YGOPro3", ygopro3)?;
		Ok::<_, Error>(())
	})
}