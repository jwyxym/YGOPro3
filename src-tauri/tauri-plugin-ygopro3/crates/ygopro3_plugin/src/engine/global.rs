mod macros;
mod request;
mod log;

use rquickjs::{Error, Object, prelude::Ctx};
use std::collections::BTreeMap;

pub fn init (ctx: Ctx<'_>, map: BTreeMap<String, bool>) -> Result<(), Error> {
	let globals: Object<'_> = ctx.globals();
	let ygopro3: Object<'_> = Object::new(ctx.clone())?;
	log::init(ctx.clone(), ygopro3.clone())?;
	request::init(ctx.clone(), ygopro3.clone(), &map)?;

	globals.set("YGOPro3", ygopro3)?;
	Ok(())
}