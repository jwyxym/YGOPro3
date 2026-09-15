use super::macros::*;

use rquickjs::{Error, Function, Object, function::Async, prelude::Ctx};

pub fn init<'js> (ctx: Ctx<'js>, ygopro3: Object<'js>) -> Result<(), Error> {
	set_async!(ctx, ygopro3, "log", |msg: String| async move {
		blocking(move || {
			ygopro3_log::log::write(format!("YGOPro3 Extend: {}", msg))
				.map_err(|err| err.to_string())
		})
		.await
	});
	Ok(())
}