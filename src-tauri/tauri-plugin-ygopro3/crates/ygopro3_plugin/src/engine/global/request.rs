use super::macros::*;

use ureq::{Body, BodyReader, delete, get, head, http::Response, options, patch, post, put};
use rquickjs::{Error, Function, Object, function::Async, prelude::Ctx};
use std::{io::Read, collections::BTreeMap};

macro_rules! set_request {
	($ctx:expr, $obj:expr, $name:literal, $method:ident) => {
		set_async!($ctx, $obj, $name, |url: String| async move {
			blocking(move || {
				let response: Response<Body> =
					$method(url).call().map_err(|err| err.to_string())?;
				read_response(response)
			})
			.await
		});
	};
}

macro_rules! set_body_request {
	($ctx:expr, $obj:expr, $name:literal, $method:ident) => {
		set_async!($ctx, $obj, $name, |url: String, body: String| async move {
			blocking(move || {
				let response: Response<Body> =
					$method(url).send(body).map_err(|err| err.to_string())?;
				read_response(response)
			})
			.await
		});
	};
}

fn read_response (response: Response<Body>) -> Result<String, String> {
	if response.status().is_success() {
		let mut body: Body = response.into_body();
		let mut reader: BodyReader<'_> = body.as_reader();
		let mut content: String = String::new();
		reader
			.read_to_string(&mut content)
			.map_err(|err| err.to_string())?;
		Ok(content)
	} else {
		Err(response.status().as_str().to_string())
	}
}

pub fn init<'js> (ctx: Ctx<'js>, ygopro3: Object<'js>, map: &BTreeMap<String, bool>) -> Result<(), Error> {
	if_plugin_allowed!(map, "PLUGIN_GET", {
		set_request!(ctx, ygopro3, "get", get);
	});
	if_plugin_allowed!(map, "PLUGIN_POST", {
		set_body_request!(ctx, ygopro3, "post", post);
	});
	if_plugin_allowed!(map, "PLUGIN_PUT", {
		set_body_request!(ctx, ygopro3, "put", put);
	});
	if_plugin_allowed!(map, "PLUGIN_PATCH", {
		set_body_request!(ctx, ygopro3, "patch", patch);
	});
	if_plugin_allowed!(map, "PLUGIN_DELETE", {
		set_request!(ctx, ygopro3, "delete", delete);
	});
	if_plugin_allowed!(map, "PLUGIN_HEAD", {
		set_request!(ctx, ygopro3, "head", head);
	});
	if_plugin_allowed!(map, "PLUGIN_OPTIONS", {
		set_request!(ctx, ygopro3, "options", options);
	});
	Ok(())
}
